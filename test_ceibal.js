const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

async function testCeibal() {
  const url = 'https://ceibal.edu.uy/institucional/articulos/';
  try {
    const response = await axios.get(url, { httpsAgent: agent, timeout: 10000 });
    const $ = cheerio.load(response.data);
    $('.article-card-item').each((i, el) => {
      if (i > 3) return;
      const title = $(el).find('h3').text().trim();
      const img1 = $(el).find('img').attr('src');
      console.log(`Title: ${title} | Img: ${img1}`);
      if (i === 0) {
        console.log($(el).html());
      }
    });
  } catch(e) {
    console.error(e.message);
  }
}
testCeibal();
