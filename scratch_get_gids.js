const axios = require('axios');

async function extractGids() {
    const url = 'https://docs.google.com/spreadsheets/d/1NFHuPEvw9Cns-M9YWtVcfx_Kd6Eo-4r6/edit?rtpof=true&sd=true';
    try {
        const { data } = await axios.get(url);
        const matches = data.match(/gid=\d+/g);
        if (matches) {
            const unique = [...new Set(matches)];
            console.log(unique);
        } else {
            console.log("No gids found.");
        }
    } catch (e) {
        console.error(e.message);
    }
}
extractGids();
