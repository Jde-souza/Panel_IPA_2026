const XLSX = require('xlsx');
const axios = require('axios');

async function debug() {
  const url = 'https://docs.google.com/spreadsheets/d/1VYYStJRPBSwO_7IBVfL60ie4KR-qF7AmTkrKYOZ5Cr4/export?format=csv&gid=223638343';
  const response = await axios.get(url, { responseType: 'text' });
  const workbook = XLSX.read(response.data, { type: 'string' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  if (rawData.length > 0) {
    const firstRow = rawData[0];
    const keys = Object.keys(firstRow);
    console.log('Keys:', keys);
    console.log('Sample Row:', firstRow);
  }
}

debug();
