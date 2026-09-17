const axios = require('axios');

async function main() {
    const url = 'https://docs.google.com/spreadsheets/d/1NFHuPEvw9Cns-M9YWtVcfx_Kd6Eo-4r6/edit?gid=326740372';
    try {
        console.log('Fetching Google Sheet landing page...');
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;
        console.log('HTML Length:', html.length);
        
        // Search for 326740372 in HTML and dump some surrounding context
        const indices = [];
        let idx = html.indexOf('326740372');
        while (idx !== -1) {
            indices.push(idx);
            idx = html.indexOf('326740372', idx + 1);
        }
        
        console.log(`Found ${indices.length} occurrences of GID 326740372:`);
        indices.slice(0, 10).forEach((pos, i) => {
            const start = Math.max(0, pos - 150);
            const end = Math.min(html.length, pos + 150);
            console.log(`\nOccurrence ${i+1} at index ${pos}:`);
            console.log(html.substring(start, end).replace(/\s+/g, ' '));
        });
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
