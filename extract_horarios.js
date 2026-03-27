const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const URL = 'https://docs.google.com/spreadsheets/d/1NFHuPEvw9Cns-M9YWtVcfx_Kd6Eo-4r6/export?format=xlsx';
const OUTPUT_PATH = path.join(__dirname, 'public', 'data', 'horarios.json');

// Pestañas que no son grillas sino listas con columnas DOCENTE, HORARIO, SALON, etc.
const LIST_SHEETS = [
    'Seminarios de Apr. e Inc.',
    'Acompañamiento a la Lengua Espa',
    'Taller de producción escrita',
    'Optativas'
];

async function extractHorarios() {
    try {
        console.log('Descargando planilla de horarios...');
        const response = await axios.get(URL, { responseType: 'arraybuffer' });
        const workbook = XLSX.read(response.data, { type: 'buffer' });
        
        const results = {};

        for (const sheetName of workbook.SheetNames) {
            if (sheetName.includes('Paquete')) { // 'Optativas' moved to LIST_SHEETS
                // Formato diferente, omitimos por ahora o manejamos aparte
                continue;
            }

            if (LIST_SHEETS.includes(sheetName)) {
                console.log(`Procesando pestaña de lista: ${sheetName}...`);
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                const specialty = sheetName;
                
                rows.forEach(row => {
                    const group = sanitizeText(row['GRUPO'] || row['Gurpos'] || 'Generales');
                    const horStr = sanitizeText(row['HORARIO'] || row['Horario'] || '');
                    const salon = sanitizeText(row['SALON'] || row['Salon'] || '');
                    const docente = sanitizeText(row['DOCENTE'] || row['Docente'] || '');
                    const materia = sanitizeText(row['SEMINARIO'] || row['UC/ASIGNATURA'] || specialty);
                    const sem = row['SEMESTRE'] || row['TEMPORALIDAD'] || 'anual';

                    if (horStr && horStr.includes(':')) {
                        // Intentar extraer día y hora (formato: "martes 10,25 a 11,55" o similar)
                        const daysMap = { 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 'jueves': 4, 'viernes': 5 };
                        let dia = 0; // Default to 0 if no day found
                        Object.keys(daysMap).forEach(d => {
                            if (horStr.toLowerCase().includes(d)) dia = daysMap[d];
                        });

                        // Limpiar hora "10,25 a 11,55" -> "10:25-11:55"
                        let timeRange = cleanTimeRange(horStr);
                        if (!timeRange.includes('-')) timeRange = horStr; // Fallback if parsing fails

                        const info = `${materia}\n${docente}\n${salon}`;
                        
                        if (!results[specialty]) results[specialty] = {};
                        if (!results[specialty][group]) results[specialty][group] = { sem1: [], sem2: [] };
                        
                        const sem1 = sem.toLowerCase().includes('1') || sem.toLowerCase().includes('anual');
                        const sem2 = sem.toLowerCase().includes('2') || sem.toLowerCase().includes('anual');

                        const classObj = { dia, hora: timeRange, info: info };
                        if (sem1) results[specialty][group].sem1.push(classObj);
                        if (sem2) results[specialty][group].sem2.push(classObj);
                    }
                });
            } else { // Original grid processing logic
                console.log(`Procesando pestaña: ${sheetName}...`);
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
                    const groupMatch = col0.match(/^[1-5]º[A-Z]/i);
                    if (groupMatch && row[1] === 'L') {
                        currentGroup1 = groupMatch[0];
                        currentGroup2 = col7.match(/^[1-5]º[A-Z]/i) ? col7.match(/^[1-5]º[A-Z]/i)[0] : currentGroup1;
                        
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
                                specialtyData[currentGroup1].sem1.push({
                                    dia: day, // 1=L, 2=M...
                                    hora: hora1,
                                    info: cellContent
                                });
                            }
                        }

                        // Semestre 2 (Cols 8-12: L-V)
                        for (let day = 8; day <= 12; day++) {
                            const cellContent = sanitizeText(row[day]);
                            if (cellContent && String(cellContent).trim().length > 5) {
                                specialtyData[currentGroup2].sem2.push({
                                    dia: day - 7, // 1=L, 2=M...
                                    hora: hora2,
                                    info: cellContent
                                });
                            }
                        }
                    }
                }

                if (Object.keys(specialtyData).length > 0) {
                    results[sheetName] = specialtyData;
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
    // Reemplaza solo caracteres de control bajos (0-31) excepto tab/newline y algunos rangos problemáticos
    // pero preserva caracteres extendidos de acentos y eñes (UTF-8)
    return String(text)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
}

extractHorarios();
