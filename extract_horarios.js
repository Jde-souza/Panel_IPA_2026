const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const URL = 'https://docs.google.com/spreadsheets/d/1NFHuPEvw9Cns-M9YWtVcfx_Kd6Eo-4r6/export?format=xlsx';
const OUTPUT_PATH = path.join(__dirname, 'public', 'data', 'horarios.json');
const CARRERAS_PATH = path.join(__dirname, 'public', 'data', 'carreras.json');
const AGENDA_PATH = path.join(__dirname, 'public', 'data', 'agenda.json');

// Pestañas que no son grillas sino listas con columnas DOCENTE, HORARIO, SALON, etc.
const LIST_SHEETS = [
    'Seminarios de Apr. e Inc.',
    'Acompañamiento a la Lengua Espa',
    'Taller de producción escrita',
    'Optativas',
    'Optativas y Talleres'
];

// Mapeo de nombres de pestañas de Google Sheets a los nombres oficiales del Plan CFE
const SHEET_TO_OFFICIAL_ESP = {
    'Ciencias Biológicas': ['Ciencias Biológicas'],
    'Ciencias Geográficas': ['Ciencias Geográficas'],
    'Com. Visual': ['Comunicación Visual'],
    'Danza': ['Danza'],
    'Derecho 2026 y Derecho-Soc. Pla': ['Derecho / Sociología', 'Derecho (2025)'],
    'Ed. Musical': ['Educación Musical'],
    'Filosofía': ['Filosofía'],
    'Física': ['Física'],
    'Historia': ['Historia'],
    'ID Español': ['Español'],
    'Inglés': ['Inglés'],
    'Literatura': ['Literatura'],
    'Matemática': ['Matemática'],
    'Química': ['Química'],
    'Sociología 2026 ': ['Sociología (2025)'],
    'Sociología 2026': ['Sociología (2025)']
};

// Alias frecuentes en la planilla de horarios hacia nombres oficiales de Unidades Curriculares CFE
const MATERIA_ALIASES = {
    'educacion y sus transformaciones en la historia': 'La Educación y sus transformaciones en la historia',
    'fundamentos 1': 'Fundamentos de la Matemática I',
    'fundamentos 2': 'Fundamentos de la Matemática II',
    'geografia fisica 1': 'Geografía Física 1. Dinámicas de la biósfera, climatología y biogeografía',
    'geografia fisica 2': 'Geografía Física 2. Hidrología y geomorfología',
    'metodologia de la danza folclorica': 'Metodologías de las Danzas I',
    'metodologia de la danza contemporanea': 'Metodologías de las Danzas I'
};

function normForMatch(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\biv\b/g, '4')
        .replace(/\biii\b/g, '3')
        .replace(/\bii\b/g, '2')
        .replace(/\bi\b/g, '1')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function loadKnownCatalog() {
    const knownMaterias = [];
    const teacherSurnames = new Set();

    if (fs.existsSync(CARRERAS_PATH)) {
        try {
            const carreras = JSON.parse(fs.readFileSync(CARRERAS_PATH, 'utf8'));
            if (Array.isArray(carreras.materias)) {
                carreras.materias.forEach(m => {
                    knownMaterias.push({
                        canonical: m.nombre,
                        norm: normForMatch(m.nombre)
                    });
                });
            }
        } catch (e) {
            console.warn('No se pudo leer carreras.json para enriquecer horarios:', e.message);
        }
    }

    for (const [aliasNorm, canonical] of Object.entries(MATERIA_ALIASES)) {
        knownMaterias.push({ canonical, norm: aliasNorm });
    }

    knownMaterias.sort((a, b) => b.norm.length - a.norm.length);

    if (fs.existsSync(AGENDA_PATH)) {
        try {
            const agenda = JSON.parse(fs.readFileSync(AGENDA_PATH, 'utf8'));
            agenda.forEach(doc => {
                if (doc.nombre && doc.nombre.includes(',')) {
                    const surname = doc.nombre.split(',')[0].trim();
                    if (surname.length >= 3) teacherSurnames.add(surname.toLowerCase());
                }
            });
        } catch (e) {
            // Ignorar si agenda.json aún no existe
        }
    }

    return { knownMaterias, teacherSurnames };
}

function matchKnownMateriaPrefix(line, knownMaterias) {
    const words = line.trim().split(/\s+/);
    for (let len = words.length; len >= 1; len--) {
        const prefixRaw = words.slice(0, len).join(' ');
        const prefixNorm = normForMatch(prefixRaw);
        for (const km of knownMaterias) {
            if (prefixNorm === km.norm) {
                return {
                    materia: km.canonical,
                    remainder: words.slice(len).join(' ').trim()
                };
            }
        }
    }
    return null;
}

function parseCellInfo(rawInfo, sheetName, catalog) {
    if (!rawInfo) return { materia: '', docente: '', salon: '' };
    let text = String(rawInfo).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    if (sheetName.toLowerCase().includes('paquete')) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const single = lines.join(' ');
        const parts = single.split(/\s{2,}/);
        const pkgMateria = sheetName.replace(/^Paquetes?\s+/i, '').trim();
        if (parts.length >= 2) {
            return {
                materia: `${pkgMateria} (${parts[0].trim()})`,
                docente: parts.slice(1).join(' ').trim(),
                salon: ''
            };
        }
        return {
            materia: pkgMateria,
            docente: single,
            salon: ''
        };
    }

    let salon = '';
    const salonRegex = /\b(SAL[OÓ]N\s+(?:\d+[A-Z]?|LEXO|DE\s+ACTOS)|LABORATORIO\s+(?:\d+|[A-Z]{2,6}(?:\s*\d+)?)|LAB\.?\s+(?:\d+|[A-Z]{2,6}(?:\s*\d+)?)|SUM|ANFITEATRO|AUDITORIO|GIMNASIO|AULA\s+\d+)\b/gi;
    const salonMatches = [...text.matchAll(salonRegex)];
    if (salonMatches.length > 0) {
        salon = [...new Set(salonMatches.map(m => m[1].replace(/\s+/g, ' ').trim().toUpperCase()))].join(' / ');
        text = text.replace(salonRegex, ' ').replace(/\s*\/\s*$/, '').trim();
    }

    let materia = '';
    let docente = '';

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
        const rawMat = lines[0].replace(/\s+/g, ' ').trim();
        const matched = matchKnownMateriaPrefix(rawMat, catalog.knownMaterias);
        materia = matched && !matched.remainder ? matched.materia : rawMat;
        docente = lines.slice(1).join(' / ').replace(/\s+/g, ' ').trim();
    } else if (lines.length === 1) {
        const line = lines[0];
        const matched = matchKnownMateriaPrefix(line.replace(/\s+/g, ' '), catalog.knownMaterias);
        if (matched) {
            materia = matched.materia;
            docente = matched.remainder.replace(/^-\s*/, '').trim();
        } else if (line.includes(' - ')) {
            const idx = line.lastIndexOf(' - ');
            const rawMat = line.slice(0, idx).replace(/\s+/g, ' ').trim();
            const mMatch = matchKnownMateriaPrefix(rawMat, catalog.knownMaterias);
            materia = mMatch && !mMatch.remainder ? mMatch.materia : rawMat;
            docente = line.slice(idx + 3).replace(/\s+/g, ' ').trim();
        } else {
            const multiSpaceParts = line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
            if (multiSpaceParts.length >= 2) {
                const mMatch = matchKnownMateriaPrefix(multiSpaceParts[0], catalog.knownMaterias);
                materia = mMatch && !mMatch.remainder ? mMatch.materia : multiSpaceParts[0];
                docente = multiSpaceParts.slice(1).join(' ');
            } else {
                const words = line.split(/\s+/);
                if (words.length >= 2) {
                    const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-záéíóúñü]/g, '');
                    const secondLastWord = words.length >= 3 ? words[words.length - 2].toLowerCase().replace(/[^a-záéíóúñü]/g, '') : '';
                    if (catalog.teacherSurnames.has(lastWord)) {
                        const subjectKeywords = new Set(['i', 'ii', 'iii', 'iv', '1', '2', '3', '4', 'en', 'de', 'la', 'el', 'del', 'las', 'los', 'y', 'su', 'ambiente', 'contemporánea', 'folclórica', 'grecolatina', 'desarrollo', 'pedagogía', 'derecho', 'música', 'acústica']);
                        if (words.length >= 3 && /^[A-ZÁÉÍÓÚÑ]/.test(words[words.length - 2]) && !subjectKeywords.has(secondLastWord)) {
                            materia = words.slice(0, -2).join(' ');
                            docente = words.slice(-2).join(' ');
                        } else {
                            materia = words.slice(0, -1).join(' ');
                            docente = words[words.length - 1];
                        }
                    } else {
                        materia = line;
                    }
                } else {
                    materia = line;
                }
            }
        }
    }

    return { materia, docente, salon };
}

async function extractHorarios() {
    try {
        const catalog = loadKnownCatalog();
        console.log('Descargando planilla de horarios...');
        const response = await axios.get(URL, { responseType: 'arraybuffer' });
        const workbook = XLSX.read(response.data, { type: 'buffer' });
        
        const results = {};

        for (const sheetName of workbook.SheetNames) {
            const trimmedSheetName = sheetName.trim();

            if (sheetName.includes('Paquete') || trimmedSheetName.toUpperCase() === 'LENGUA EXTRANJERA I Y II') { // Nueva lógica para procesar paquetes
                const pkgSheetTitle = trimmedSheetName.toUpperCase() === 'LENGUA EXTRANJERA I Y II'
                    ? 'Paquetes Lengua Extranjera I y II'
                    : trimmedSheetName;
                console.log(`Procesando pestaña de paquete: ${pkgSheetTitle}...`);
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                const specialtyData = {};
                let currentGroup1 = null;

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    const col0 = String(row[0]).trim();
                    
                    if (/^PAQUETE\s+\d/i.test(col0)) {
                        currentGroup1 = col0;
                        if (!specialtyData[currentGroup1]) specialtyData[currentGroup1] = { sem1: [], sem2: [] };
                    }
                    else if (col0.match(/^[1-5][º°][A-Z]/i) && row[1] === 'L') {
                        currentGroup1 = col0.match(/^[1-5][º°][A-Z]/i)[0].replace('°', 'º');
                        if (!specialtyData[currentGroup1]) specialtyData[currentGroup1] = { sem1: [], sem2: [] };
                    }

                    const timeMatch = col0.match(/^\d{2}:\d{2}/);
                    if (timeMatch && currentGroup1) {
                        const hora1 = cleanTimeRange(col0);
                        for (let day = 1; day <= 5; day++) {
                            const cellContent = sanitizeText(row[day]);
                            if (cellContent && String(cellContent).trim().length > 5) {
                                const parsed = parseCellInfo(cellContent, pkgSheetTitle, catalog);
                                const classObj = {
                                    dia: day,
                                    hora: hora1,
                                    materia: parsed.materia,
                                    docente: parsed.docente,
                                    salon: parsed.salon,
                                    info: cellContent
                                };
                                specialtyData[currentGroup1].sem1.push(classObj);
                                specialtyData[currentGroup1].sem2.push(classObj);
                            }
                        }
                    }
                }
                if (Object.keys(specialtyData).length > 0) {
                    results[pkgSheetTitle] = specialtyData;
                }
                continue;
            }

            if (LIST_SHEETS.includes(trimmedSheetName) || LIST_SHEETS.includes(sheetName)) {
                console.log(`Procesando pestaña de lista: ${trimmedSheetName}...`);
                const sheet = workbook.Sheets[sheetName];
                const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                const specialty = trimmedSheetName;
                const daysMap = { 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 'jueves': 4, 'viernes': 5 };

                let activeHeaders = null;
                let sectionTitle = specialty;

                for (let i = 0; i < rawRows.length; i++) {
                    const r = rawRows[i].map(c => sanitizeText(c));
                    if (r.every(c => !c)) continue;

                    const upper = r.map(c => c.toUpperCase());
                    if (upper.some(c => c.includes('HORARIO')) && upper.some(c => c.includes('SALON') || c.includes('SALÓN') || c.includes('DOCENTE') || c.includes('GRUPO'))) {
                        activeHeaders = upper;
                        continue;
                    }

                    const nonEmpty = r.filter(Boolean);
                    if (nonEmpty.length === 1 && nonEmpty[0].length > 5) {
                        sectionTitle = nonEmpty[0];
                        continue;
                    }

                    if (!activeHeaders) continue;

                    const getCol = (keywords) => {
                        const idx = activeHeaders.findIndex(h => keywords.some(k => h.includes(k)));
                        return idx !== -1 ? (r[idx] || '') : '';
                    };

                    const horStr = getCol(['HORARIO']);
                    if (!horStr || (!horStr.includes(':') && !horStr.includes(','))) continue;

                    let dia = 1;
                    Object.keys(daysMap).forEach(d => {
                        if (horStr.toLowerCase().includes(d)) dia = daysMap[d];
                    });

                    // Extraer rango horario ej. "lunes 18:20 a 19:40" o "martes 10,25 a 11,55"
                    const rangeMatch = horStr.match(/(\d{1,2}[:.,]\d{2})\s*(?:a|-)\s*(\d{1,2}[:.,]\d{2})/i);
                    const timeRange = rangeMatch ? cleanTimeRange(`${rangeMatch[1]} a ${rangeMatch[2]}`) : cleanTimeRange(horStr);

                    let rawMateria = getCol(['UC/ASIGNATURA', 'SEMINARIO']) || sectionTitle;
                    let docente = getCol(['DOCENTE']);
                    const group = getCol(['CURSO', 'GRUPO', 'GURPOS']) || 'Generales';
                    const salonRaw = getCol(['SALON', 'SALÓN']);
                    const salon = salonRaw && salonRaw !== '-' ? (/^\d+$/.test(salonRaw) ? `SALON ${salonRaw}` : salonRaw) : '';
                    const sem = getCol(['SEMESTRE', 'TEMPORALIDAD']) || 'anual';

                    if (!docente && rawMateria.includes(' - ')) {
                        const parts = rawMateria.split(' - ');
                        rawMateria = parts[0].trim();
                        docente = parts.slice(1).join(' - ').trim();
                    }

                    const info = [rawMateria, docente, salon].filter(Boolean).join('\n');
                    if (!results[specialty]) results[specialty] = {};
                    const grpKey = /^\d+$/.test(group) ? `Grupo ${group}` : group;
                    if (!results[specialty][grpKey]) results[specialty][grpKey] = { sem1: [], sem2: [] };

                    const sem1 = sem.toLowerCase().includes('1') || sem.toLowerCase().includes('anual') || sem === '-';
                    const sem2 = sem.toLowerCase().includes('2') || sem.toLowerCase().includes('anual') || sem === '-';

                    const classObj = {
                        dia,
                        hora: timeRange,
                        materia: rawMateria,
                        docente,
                        salon,
                        info
                    };
                    if (sem1) results[specialty][grpKey].sem1.push(classObj);
                    if (sem2) results[specialty][grpKey].sem2.push(classObj);
                }
            } else { // Original grid processing logic
                console.log(`Procesando pestaña: ${trimmedSheetName}...`);
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                
                const specialtyData = {};
                let currentGroup1 = null;
                let currentGroup2 = null;

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    const col0 = String(row[0]).trim();
                    const col7 = row[7] ? String(row[7]).trim() : '';

                    // Detección de cabecera de grupo (Ej: 1°A o 4ºB)
                    const groupMatch = col0.match(/^[1-5][º°][A-Z]/i);
                    if (groupMatch && row[1] === 'L') {
                        currentGroup1 = groupMatch[0].replace('°', 'º');
                        const groupMatch2 = col7.match(/^[1-5][º°][A-Z]/i);
                        currentGroup2 = groupMatch2 ? groupMatch2[0].replace('°', 'º') : currentGroup1;
                        
                        if (!specialtyData[currentGroup1]) specialtyData[currentGroup1] = { sem1: [], sem2: [] };
                        if (!specialtyData[currentGroup2]) specialtyData[currentGroup2] = { sem1: [], sem2: [] };
                    }

                    // Detección de fila de horario (Ej: 08:00-08:45)
                    const timeMatch = col0.match(/^\d{2}:\d{2}/);
                    if (timeMatch && currentGroup1) {
                        const hora1 = cleanTimeRange(col0);
                        const hora2 = col7 ? cleanTimeRange(col7) : hora1;

                        // Semestre 1 (Cols 1-5: L-V)
                        for (let day = 1; day <= 5; day++) {
                            const cellContent = sanitizeText(row[day]);
                            if (cellContent && String(cellContent).trim().length > 5) {
                                const parsed = parseCellInfo(cellContent, trimmedSheetName, catalog);
                                specialtyData[currentGroup1].sem1.push({
                                    dia: day,
                                    hora: hora1,
                                    materia: parsed.materia,
                                    docente: parsed.docente,
                                    salon: parsed.salon,
                                    info: cellContent
                                });
                            }
                        }

                        // Semestre 2 (Cols 8-12: L-V)
                        for (let day = 8; day <= 12; day++) {
                            const cellContent = sanitizeText(row[day]);
                            if (cellContent && String(cellContent).trim().length > 5) {
                                const parsed = parseCellInfo(cellContent, trimmedSheetName, catalog);
                                specialtyData[currentGroup2].sem2.push({
                                    dia: day - 7,
                                    hora: hora2,
                                    materia: parsed.materia,
                                    docente: parsed.docente,
                                    salon: parsed.salon,
                                    info: cellContent
                                });
                            }
                        }
                    }
                }

                if (Object.keys(specialtyData).length > 0) {
                    const targetNames = SHEET_TO_OFFICIAL_ESP[sheetName] || SHEET_TO_OFFICIAL_ESP[trimmedSheetName] || [trimmedSheetName];
                    for (const targetEsp of targetNames) {
                        results[targetEsp] = specialtyData;
                    }
                }
            }
        }

        if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
            fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
        console.log(`Éxito: Se guardaron horarios de ${Object.keys(results).length} especialidades en ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('Error durante la extracción:', error.message);
    }
}

function cleanTimeRange(time) {
    if (!time) return '';
    // "13:30  a 14:15" -> "13:30-14:15"
    // "8:00 - 8:45" -> "08:00-08:45"
    let t = String(time).toLowerCase()
        .replace(/\s+a\s+/g, '-')
        .replace(/\s+/g, '')
        .replace(/,/g, ':');
    
    if (t.includes('-')) {
        let [start, end] = t.split('-');
        const padTime = (str) => {
            if (!str.includes(':')) return str;
            let [h, m] = str.split(':');
            return h.padStart(2, '0') + ':' + m.padStart(2, '0');
        };
        return `${padTime(start)}-${padTime(end)}`;
    }
    return t;
}

function sanitizeText(text) {
    if (!text) return '';
    return String(text)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
}

extractHorarios();
