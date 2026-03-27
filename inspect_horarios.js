const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');

async function inspectHorarios() {
  const url = 'https://docs.google.com/spreadsheets/d/1NFHuPEvw9Cns-M9YWtVcfx_Kd6Eo-4r6/export?format=xlsx';
  try {
    console.log('Descargando planilla de horarios...');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const workbook = XLSX.read(response.data, { type: 'buffer' });
    
    console.log('Pestañas encontradas:', workbook.SheetNames);
    
    const sheetName = 'Ciencias Biológicas';
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Mostramos las primeras 50 filas para ver la estructura de los grupos
    console.log(`\n--- Muestra de ${sheetName} ---`);
    for (let i = 0; i < Math.min(data.length, 100); i++) {
        console.log(`Fila ${i}:`, data[i].slice(0, 13).join(' | '));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectHorarios();
