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
    const workbook = XLSX.read(csvData, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convertimos a JSON con encabezados
    const rawData = XLSX.utils.sheet_to_json(sheet);

    // Función para formatear fechas (maneja strings y números de Excel)
    const formatDate = (val) => {
      if (!val) return '';
      if (typeof val === 'number') {
        const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
        return `${jsDate.getDate()}/${jsDate.getMonth() + 1}/${jsDate.getFullYear()}`;
      }
      return String(val).trim();
    };

    // Mapeamos a un formato más amigable para el frontend explorando las claves exactas
    const processedData = rawData.map(row => {
      // Usamos los nombres exactos de las columnas identificados en la depuración
      const inasistencia = {
        timestamp: row['Marca temporal'] || '',
        email: row['Dirección de correo electrónico'] || '',
        nombre: (row['Nombre'] || '').trim(),
        apellido: (row['Apellido'] || '').trim(),
        inicio: formatDate(row['Fecha de inicio de la inasistencia / licencia']),
        fin: formatDate(row['Fecha de finalización de la inasistencia / licencia']),
        grupos: row['Indique  Grupos / Especialidades'] || '',
        asignaturas: []
      };

      // Recolectamos asignaturas y causales (que a veces sirven de info adicional)
      if (row['Indique ASIGNATURA']) inasistencia.asignaturas.push(row['Indique ASIGNATURA']);
      if (row['Causal (No estará visible para consulta estudiantil)']) {
        inasistencia.asignaturas.push(row['Causal (No estará visible para consulta estudiantil)']);
      }

      return inasistencia;
    });

    // Filtramos registros vacíos o inválidos
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
