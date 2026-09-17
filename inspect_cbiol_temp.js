const XLSX = require('xlsx');
const axios = require('axios');

async function main() {
    const url = 'https://docs.google.com/spreadsheets/d/1NFHuPEvw9Cns-M9YWtVcfx_Kd6Eo-4r6/export?format=xlsx';
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const workbook = XLSX.read(response.data, { type: 'buffer' });
        const sheet = workbook.Sheets['Ciencias Biológicas'];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        console.log('Inspecting first column values for potential groups:');
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            const col0 = String(row[0]).trim();
            const col1 = String(row[1]).trim();
            
            if (col0 && (col0.includes('A') || col0.includes('B') || col0.includes('C') || col0.includes('D')) && col0.length < 10) {
                const matchOld = col0.match(/^[1-5]º[A-Z]/i);
                const matchNew = col0.match(/^[1-5][º°][A-Z]/i);
                console.log(`Row ${i}: col0="${col0}" col1="${col1}" | OldMatch=${!!matchOld} NewMatch=${!!matchNew}`);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
