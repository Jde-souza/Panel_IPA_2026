const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const URL = 'https://docs.google.com/spreadsheets/d/1M4x_9xmRQvPbd8apHkyh61HVlIoKQdU7/export?format=xlsx';
const OUTPUT_PATH = path.join(__dirname, 'public', 'data', 'examenes.json');

async function extractExamenes() {
    try {
        console.log('Descargando planilla de exámenes...');
        const response = await axios.get(URL, { responseType: 'arraybuffer' });
        const workbook = XLSX.read(response.data, { type: 'buffer' });
        
        // Asumimos que la primera hoja es la de Setiembre 2026 (o la principal)
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Leemos la planilla como array de arrays
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        const results = [];
        let currentDia = '';
        let currentHora = '';
        
        // Buscar la fila de cabeceras para saber el índice de las columnas
        let headerRowIndex = -1;
        let colIndices = {
            dia: 0, hora: 1, examen: 2, anio: 3, plan: 4, trib1: 5, trib2: 6, trib3: 7, salones: 8
        }; // Valores por defecto basados en lo que vimos, pero intentaremos buscarlos
        
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const rowStr = data[i].join('').toLowerCase();
            if (rowStr.includes('examen') && rowStr.includes('hora') && rowStr.includes('tribunal')) {
                headerRowIndex = i;
                // Encontrar índices dinámicamente si es posible
                const headers = data[i].map(h => String(h).toLowerCase().trim());
                colIndices.dia = headers.findIndex(h => h.includes('fecha') || h.match(/\d+\/\d+\/\d+/) || i === 0 ? 0 : 0);
                colIndices.hora = headers.findIndex(h => h === 'hora');
                colIndices.examen = headers.findIndex(h => h === 'examen' || h === 'asignatura');
                colIndices.anio = headers.findIndex(h => h.includes('año') || h.includes('ao'));
                colIndices.plan = headers.findIndex(h => h === 'plan');
                colIndices.trib1 = headers.findIndex(h => h === 'tribunal');
                colIndices.salones = headers.findIndex(h => h.includes('salon') || h.includes('salones'));
                break;
            }
        }
        
        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 1;

        for (let i = startRow; i < data.length; i++) {
            const row = data[i];
            
            // Si la fila está completamente vacía, saltar
            if (!row || row.join('').trim() === '') continue;
            
            const rawDia = row[colIndices.dia] ? String(row[colIndices.dia]).trim() : '';
            const rawHora = row[colIndices.hora] ? String(row[colIndices.hora]).trim() : '';
            const examen = row[colIndices.examen] ? String(row[colIndices.examen]).trim() : '';
            
            if (rawDia) currentDia = rawDia;
            if (rawHora) currentHora = rawHora;
            
            // Si no hay examen en esta fila, puede ser un error de formato o fila vacía, saltar
            if (!examen) continue;

            const anio = row[colIndices.anio] ? String(row[colIndices.anio]).trim() : '';
            const plan = row[colIndices.plan] ? String(row[colIndices.plan]).trim() : '';
            
            const tribunal = [];
            // Los miembros del tribunal suelen estar en la columna de "Tribunal" y las 2 siguientes
            const tCol = colIndices.trib1 !== -1 ? colIndices.trib1 : 5;
            if (row[tCol] && String(row[tCol]).trim()) tribunal.push(String(row[tCol]).trim());
            if (row[tCol + 1] && String(row[tCol + 1]).trim()) tribunal.push(String(row[tCol + 1]).trim());
            if (row[tCol + 2] && String(row[tCol + 2]).trim()) tribunal.push(String(row[tCol + 2]).trim());
            
            const salones = colIndices.salones !== -1 && row[colIndices.salones] ? String(row[colIndices.salones]).trim() : '';

            // Limpiar saltos de línea de las celdas
            const cleanText = (text) => text.replace(/\r?\n|\r/g, ' ').trim();

            results.push({
                dia: cleanText(currentDia),
                hora: cleanText(currentHora),
                examen: cleanText(examen),
                anio: cleanText(anio),
                plan: cleanText(plan),
                tribunal: tribunal.map(cleanText),
                salones: cleanText(salones)
            });
        }

        if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
            fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
        console.log(`Éxito: Se guardaron ${results.length} exámenes en ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('Error durante la extracción de exámenes:', error.message);
    }
}

extractExamenes();
