const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/1YsG6DqIjHbltK7_oA5qxCK9SCI5_QVWt/export?format=csv&gid=';
const GIDS = [
    '803701102',  // 1ro
    '1422338208', // 2do
    '1535065204', // 3ro
    '308829715',  // 4to
    '1776693590', // Hoja 1
    '760292604'   // TALLERES
];
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'agenda.json');
const HORARIOS_PATH = path.join(process.cwd(), 'public', 'data', 'horarios.json');

// --- Helper Functions ---

function splitCSV(line) {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        let char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

function capitalize(str) {
    if (!str) return "";
    return str.toLowerCase().replace(/(?:^|\s|-)\S/g, l => l.toUpperCase());
}

/**
 * Normaliza un nombre al formato "Apellido, Nombre"
 * @param {string} name 
 * @returns {string}
 */
function normalizeName(name) {
    if (!name) return "";
    let clean = name.trim().replace(/^"|"$/g, '').replace(/\s+/g, ' ');
    
    // Si ya tiene coma, asumimos que es Apellido, Nombre
    if (clean.includes(',')) {
        let parts = clean.split(',').map(s => s.trim());
        let last = parts[0];
        let first = parts.slice(1).join(' ');
        return `${capitalize(last)}, ${capitalize(first)}`;
    }
    
    // Si no tiene coma, asumimos Nombre Apellido
    let parts = clean.split(' ');
    if (parts.length >= 2) {
        let allCapsIndex = parts.findIndex(p => p.length > 1 && p === p.toUpperCase());
        if (allCapsIndex !== -1) {
            let last = parts.slice(allCapsIndex).join(' ');
            let first = parts.slice(0, allCapsIndex).join(' ');
            if (!first) { 
                 first = parts.slice(1).join(' ');
                 last = parts[0];
            }
            return `${capitalize(last)}, ${capitalize(first)}`;
        }
        let last = parts[parts.length - 1];
        let first = parts.slice(0, parts.length - 1).join(' ');
        return `${capitalize(last)}, ${capitalize(first)}`;
    }
    return capitalize(clean);
}

function normalizeObservacion(str) {
    if (!str) return "";
    let res = str.trim();
    if (res.toLowerCase().includes("pase en func")) return "Pase en funciones";
    if (res.toLowerCase().includes("lic. méd") || res.toLowerCase().includes("lic méd")) return "Licencia médica";
    return res;
}

/**
 * Crea una versión simplificada del nombre para comparaciones cruzadas (sin tildes, comas ni espacios extra)
 */
function getCompareKey(name) {
    if (!name) return "";
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/[^a-z0-9]/g, ''); // Solo letras y números
}

function normalizePhone(phone) {
    if (!phone) return "";
    return phone.toString().trim().replace(/^"|"$/g, '').replace(/[^0-9\s.+-]/g, '');
}

function normalizeEmail(email) {
    if (!email) return "";
    return email.toString().trim().replace(/^"|"$/g, '').toLowerCase();
}

// --- Main Extraction Logic ---

async function extractAgenda() {
    try {
        console.log('--- Iniciando actualización profunda de Agenda Docente ---');
        
        // 1. Cargar horarios para el cruce de datos
        let horariosData = {};
        if (fs.existsSync(HORARIOS_PATH)) {
            horariosData = JSON.parse(fs.readFileSync(HORARIOS_PATH, 'utf8'));
            console.log('Datos de horarios cargados para cruce.');
        }

        // 2. Descargar datos de Nómina (Google Sheets - Varias pestañas)
        let docenteMap = new Map(); // clave: compareKey, valor: objeto docente
        
        console.log(`Iniciando descarga de ${GIDS.length} pestañas de la nómina...`);

        for (const gid of GIDS) {
            console.log(`- Descargando pestaña GID: ${gid}...`);
            const url = `${SPREADSHEET_BASE_URL}${gid}`;
            const response = await axios.get(url, {
                responseType: 'text',
                timeout: 15000
            });

            const lines = response.data.split('\n');
            
            lines.forEach((line, index) => {
                if (index < 6) return; // Encabezados
                if (!line.trim()) return;
                
                const cols = splitCSV(line);
                if (cols.length < 11) return;
                
                const rawEspecialidad = cols[0];
                const rawGrupo = cols[1];
                const rawAsignatura = cols[3];
                const rawDocente = cols[5];
                const rawCaracter = cols[7];
                const rawStatus = cols[8]; // REN/RES/LM/OTROS
                const rawTel = cols[9];
                const rawEmail = cols[10];
                
                if (!rawDocente || ["DOCENTE", "-", "ASIGNATURA", "NOMBRE"].includes(rawDocente.toUpperCase())) return;
                
                const normName = normalizeName(rawDocente);
                const compareKey = getCompareKey(normName);
                
                if (!docenteMap.has(compareKey)) {
                    docenteMap.set(compareKey, {
                        nombre: normName,
                        telefono1: normalizePhone(rawTel),
                        telefono2: "",
                        email: normalizeEmail(rawEmail),
                        especialidades: new Set(),
                        asignaturas: new Set(),
                        grupos: new Set(),
                        caracter: rawCaracter || "",
                        observacion: rawStatus ? rawStatus.trim() : "",
                        isTachado: rawStatus ? rawStatus.trim().length > 2 : false,
                        horarios: []
                    });
                }
                
                const doc = docenteMap.get(compareKey);
                if (rawEspecialidad && rawEspecialidad.length > 2) doc.especialidades.add(capitalize(rawEspecialidad));
                if (rawAsignatura && rawAsignatura.length > 2) doc.asignaturas.add(capitalize(rawAsignatura));
                if (rawGrupo && rawGrupo.length > 1) doc.grupos.add(rawGrupo.toUpperCase());
                
                // Actualizar tel/email/caracter si no los tenía y ahora sí
                if (!doc.telefono1 && rawTel) doc.telefono1 = normalizePhone(rawTel);
                if (!doc.email && rawEmail) doc.email = normalizeEmail(rawEmail);
                if ((!doc.caracter || doc.caracter === "-") && rawCaracter) doc.caracter = rawCaracter;
                if (!doc.observacion && rawStatus && rawStatus.trim().length > 2) {
                    doc.observacion = normalizeObservacion(rawStatus);
                    doc.isTachado = true;
                }
            });
        }

        console.log(`${docenteMap.size} docentes identificados en la nómina.`);

        // 3. Cruce con Horarios
        console.log('Cruzando con datos de horarios semanales...');
        for (const [espName, grupos] of Object.entries(horariosData)) {
            for (const [grupoName, periodos] of Object.entries(grupos)) {
                // Procesar ambos semestres
                const allClases = [...(periodos.sem1 || []), ...(periodos.sem2 || [])];
                
                allClases.forEach(clase => {
                    const infoParts = clase.info.split('\n').map(p => p.trim());
                    
                    let asignatura = "S/D";
                    let docenteName = "S/D";
                    let salon = "S/D";
                    
                    if (infoParts.length >= 2) {
                        asignatura = infoParts[0];
                        docenteName = infoParts[1];
                        if (infoParts.length > 2) salon = infoParts[2];
                    } else {
                        // Formato en una sola línea tipo: "Historia   Alpini        SALON 201"
                        const content = infoParts[0];
                        const salonMatch = content.match(/SALON\s*([0-9A-Z]+)/i);
                        if (salonMatch) {
                            salon = 'SALON ' + salonMatch[1];
                            asignatura = content.replace(salonMatch[0], '').trim();
                        } else {
                            asignatura = content;
                        }
                        docenteName = content; // Usaremos el texto completo para buscar al docente por coincidencia de apellido
                    }
                    
                    let targetDoc = null;
                    const cleanClaseInfo = getCompareKey(docenteName);
                    
                    for (const doc of docenteMap.values()) {
                        const lastFirst = doc.nombre.split(',').map(s => s.trim().toLowerCase());
                        const lastName = getCompareKey(lastFirst[0]);
                        
                        // Validar que el apellido sea significativo y esté en el texto
                        if (lastName.length > 2 && cleanClaseInfo.includes(lastName)) {
                            targetDoc = doc;
                            
                            // Limpiar el nombre del profe de la asignatura para que quede más prolija en la UI
                            const docNameParts = targetDoc.nombre.split(',').map(s => s.trim());
                            const regexApellido = new RegExp(docNameParts[0], 'i');
                            asignatura = asignatura.replace(regexApellido, '').trim();
                            // También quitamos nombres si se encontraron
                            if (docNameParts.length > 1) {
                                const names = docNameParts[1].split(' ');
                                names.forEach(n => {
                                    if (n.length > 2) {
                                        asignatura = asignatura.replace(new RegExp(n, 'i'), '').trim();
                                    }
                                });
                            }
                            
                            break;
                        }
                    }
                    
                    if (targetDoc) {
                        const yaExiste = targetDoc.horarios.some(h => 
                            h.dia === clase.dia && h.hora === clase.hora && h.asignatura === asignatura
                        );
                        
                        if (!yaExiste) {
                            targetDoc.horarios.push({
                                dia: clase.dia,
                                hora: clase.hora,
                                salon: salon,
                                grupo: grupoName,
                                asignatura: asignatura
                            });
                            // Si el grupo es de Horarios, asegurarnos que esté en la lista de grupos del docente
                            if (grupoName && !Array.from(targetDoc.grupos).includes(grupoName)) {
                                targetDoc.grupos.add(grupoName);
                            }
                        }
                    }
                });
            }
        }

        // 4. Limpieza y guardado
        const finalAgenda = Array.from(docenteMap.values()).map(doc => ({
            nombre: doc.nombre,
            telefono1: doc.telefono1,
            telefono2: doc.telefono2,
            email: doc.email,
            especialidades: Array.from(doc.especialidades),
            asignaturas: Array.from(doc.asignaturas),
            grupos: Array.from(doc.grupos),
            caracter: doc.caracter,
            observacion: doc.observacion,
            isTachado: doc.isTachado,
            horarios: doc.horarios.sort((a, b) => (a.dia * 100 + parseInt(a.hora)) - (b.dia * 100 + parseInt(b.hora)))
        }))
        .filter(doc => doc.nombre && doc.nombre.includes(','))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalAgenda, null, 2));
        
        console.log(`Resumen de actualización:`);
        console.log(`- Total docentes procesados: ${finalAgenda.length}`);
        console.log(`Archivo guardado exitosamente en ${OUTPUT_PATH}`);
        console.log('--- Proceso de Agenda completado ---');

    } catch (error) {
        console.error('Error al actualizar la agenda:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

extractAgenda();
