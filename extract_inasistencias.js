const axios = require('axios');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1VYYStJRPBSwO_7IBVfL60ie4KR-qF7AmTkrKYOZ5Cr4/export?format=csv&gid=223638343';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'inasistencias.json');

async function fetchInasistencias() {
  try {
    console.log('Descargando inasistencias desde Google Sheets...');
    const response = await axios.get(SPREADSHEET_URL, {
      responseType: 'text',
      timeout: 10000
    });

    const csvData = response.data;
    // raw: false hace que XLSX convierta los valores numéricos de fecha a strings
    // dateNF: 'dd/mm/yyyy' fuerza el formato europeo (día/mes/año) evitando
    // el bug de zona horaria donde "11/5/2026" se leía como noviembre 5 → número serial → "4/11/2026"
    const workbook = XLSX.read(csvData, { type: 'string', raw: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convertimos a JSON con encabezados manteniendo los strings originales del CSV
    const rawData = XLSX.utils.sheet_to_json(sheet, { raw: true });

    // Función para normalizar fechas ya en formato string DD/MM/YYYY
    const formatDate = (val) => {
      if (!val) return '';
      return String(val).trim();
    };

    // Mapeamos a un formato más amigable para el frontend explorando las claves de forma dinámica
    const processedData = rawData.map(row => {
      const allKeys = Object.keys(row);
      
      // Búsqueda dinámica de las columnas (insensible a mayúsculas y acentos rotos)
      const findKey = (searchStrs) => allKeys.find(k => searchStrs.some(s => k.toLowerCase().includes(s)));
      
      const emailKey = findKey(['correo']);
      const nameKey = findKey(['nombre']);
      const lastNameKey = findKey(['apellido']);
      const inicioKey = findKey(['inicio de la inasistencia', 'inicio']);
      const finKey = findKey(['finalizaci', 'finalizacio']);
      const gruposKey = findKey(['grupos']);

      const inasistencia = {
        timestamp: row['Marca temporal'] || '',
        email: emailKey ? (row[emailKey] || '') : '',
        nombre: nameKey ? (row[nameKey] || '').trim() : '',
        apellido: lastNameKey ? (row[lastNameKey] || '').trim() : '',
        inicio: formatDate(inicioKey ? row[inicioKey] : ''),
        fin: formatDate(finKey ? row[finKey] : ''),
        grupos: gruposKey ? (row[gruposKey] || '') : '',
        asignaturas: []
      };

      // Recolectamos asignaturas (Indique ASIGNATURA, Indique ASIGNATURA_1, etc.)
      const asignaturaKeys = allKeys.filter(k => k.toLowerCase().includes('asignatura'));
      asignaturaKeys.forEach(key => {
        const val = (row[key] || '').toString().trim();
        if (val) inasistencia.asignaturas.push(val);
      });

      return inasistencia;
    });

    // Filtramos registros vacíos o inválidos (nombre y fecha de inicio requeridos)
    const validData = processedData.filter(d => d.nombre && d.inicio);

    // Guardamos el resultado
    if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
      fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(validData, null, 2));
    console.log(`Éxito: Se guardaron ${validData.length} inasistencias en ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('Error al procesar las inasistencias:', error.message);
    process.exit(1);
  }
}

fetchInasistencias();
