const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

const sites = [
  { name: 'ANEP', url: 'https://www.anep.edu.uy/', type: 'anep' },
  { name: 'CFE', url: 'https://www.cfe.edu.uy/', type: 'cfe' },
  { name: 'DGEIP', url: 'https://www.dgeip.edu.uy/documentos/2025/portal/index.html', baseUrl: 'https://www.dgeip.edu.uy/', type: 'dgeip' },
  { name: 'DGES', url: 'https://www.dges.edu.uy/', type: 'dges' },
  { name: 'UTU', url: 'https://www.utu.edu.uy/feed/', type: 'utu' },
  { name: 'CEIBAL', url: 'https://ceibal.edu.uy/institucional/articulos/', type: 'ceibal' }
];

const agent = new https.Agent({  
  rejectUnauthorized: false
});

/**
 * Resolves relative URLs to absolute URLs
 */
function resolveUrl(baseUrl, relativeUrl) {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith('http')) return relativeUrl;
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (e) {
    return relativeUrl;
  }
}

async function fetchFromSite(site) {
  try {
    console.log(`Fetching news from ${site.name}...`);
    const response = await axios.get(site.url, { 
      httpsAgent: agent,
      timeout: 10000,
      insecureHTTPParser: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    let newsItems = [];
    const base = site.baseUrl || site.url;

    if (site.type === 'anep') {
      $('a.noticia-vista, a.noticia-destacada').each((i, el) => {
        const title = $(el).find('h2').text().trim() || $(el).attr('title')?.trim();
        const link = $(el).attr('href');
        const img = $(el).find('img').attr('src');
        
        if (title && link) {
          newsItems.push({
            title,
            url: resolveUrl(base, link),
            imageUrl: resolveUrl(base, img),
            source: 'ANEP',
            date: new Date().toLocaleDateString()
          });
        }
      });
    } else if (site.type === 'cfe') {
      $('.novedades-item, .news-item, .item-list li, h3').each((i, el) => {
        const title = $(el).find('a').text().trim() || $(el).find('h3').text().trim() || $(el).text().trim();
        const link = $(el).find('a').attr('href') || $(el).attr('href');
        let img = $(el).find('img').attr('src');
        
        if (!img) {
          const style = $(el).find('.imagen, .image, .picture, .views-field-field-imagen').attr('style');
          const match = style?.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match) img = match[1];
        }

        if (title && link && title.length > 10 && !title.includes('Leer más')) {
          newsItems.push({
            title,
            url: resolveUrl(base, link),
            imageUrl: resolveUrl(base, img),
            source: 'CFE',
            date: new Date().toLocaleDateString()
          });
        }
      });
    } else if (site.type === 'dgeip') {
      $('a[href*="/prensa/"]').each((i, el) => {
        const title = $(el).find('.title, h3').text().trim() || $(el).text().trim();
        const link = $(el).attr('href');
        const img = $(el).find('img').attr('src');
        
        if (title && title.length > 5 && !['Noticias', 'Calendario'].includes(title)) {
          newsItems.push({
            title,
            url: resolveUrl(base, link),
            imageUrl: resolveUrl(base, img),
            source: 'DGEIP',
            date: new Date().toLocaleDateString()
          });
        }
      });
    } else if (site.type === 'dges') {
      $('a.position-relative, .views-row, a.text-decoration-none').each((i, el) => {
        const title = $(el).find('h2, .title, a').first().text().trim() || $(el).text().trim();
        const link = $(el).find('a').attr('href') || $(el).attr('href');
        const img = $(el).find('img').attr('src');
        
        if (title && link && title.length > 8) {
          newsItems.push({
            title,
            url: resolveUrl(base, link),
            imageUrl: resolveUrl(base, img),
            source: 'DGES',
            date: new Date().toLocaleDateString()
          });
        }
      });
    } else if (site.type === 'utu') {
      // Parse RSS Feed
      const $xml = cheerio.load(response.data, { xmlMode: true });
      $xml('item').each((i, el) => {
        const title = $xml(el).find('title').text().trim();
        const link = $xml(el).find('link').text().trim();
        
        // Try to find image in description or content
        const content = $xml(el).find('content\\:encoded, description').text();
        const imgMatch = content.match(/src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
        const img = imgMatch ? imgMatch[1] : null;

        if (title && link) {
          newsItems.push({
            title,
            url: link,
            imageUrl: img,
            source: 'UTU',
            date: new Date().toLocaleDateString()
          });
        }
      });
    } else if (site.type === 'ceibal') {
      $('.article-card-item').each((i, el) => {
        const title = $(el).find('h3').text().trim();
        const link = $(el).attr('href');
        const img = $(el).find('figure img').attr('src');
        
        if (title && link) {
          newsItems.push({
            title,
            url: resolveUrl(base, link),
            imageUrl: resolveUrl(base, img),
            source: 'CEIBAL',
            date: new Date().toLocaleDateString()
          });
        }
      });
    }

    return newsItems.slice(0, 6);
  } catch (error) {
    console.error(`Error fetching ${site.name}:`, error.message);
    return [];
  }
}

async function fetchLlamados() {
  try {
    console.log('Fetching llamados from ANEP...');
    const url = 'https://www.anep.edu.uy/llamados';
    const response = await axios.get(url, { 
      httpsAgent: agent,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(response.data);
    const llamados = [];

    // Keywords for classification
    const docenteKeywords = ['docente', 'aspiraciones', 'elección de horas', 'profesor', 'maestro', 'asignatura', 'perfil'];
    const noDocenteKeywords = ['no docente', 'gestión', 'administrativo', 'personal de servicio', 'servicios generales', 'pasante', 'becario', 'oficios', 'chofer', 'vidriero', 'mantenimiento'];

    $('.view-llamados table.views-table tbody tr').each((i, el) => {
      const title = $(el).find('td.views-field-title a').text().trim();
      const link = $(el).find('td.views-field-title a').attr('href');
      const origen = $(el).find('td.views-field-field-origen').text().trim();
      const info = $(el).find('td.views-field-field-informacion-adicional').text().trim();

      if (title && link) {
        const fullLink = resolveUrl(url, link);
        const titleLower = title.toLowerCase();
        
        // Logical classification
        let category = 'docente'; // Default
        
        // Check for no-docente keywords first (usually more specific)
        const isNoDocente = noDocenteKeywords.some(key => titleLower.includes(key));
        if (isNoDocente) {
          category = 'no-docente';
        } else {
          // Verify if it's actually docente
          const isDocente = docenteKeywords.some(key => titleLower.includes(key));
          if (!isDocente && (titleLower.includes('gestión') || titleLower.includes('administrativo'))) {
            category = 'no-docente';
          }
        }

        llamados.push({
          title,
          url: fullLink,
          origen,
          info,
          category
        });
      }
    });

    return llamados;
  } catch (error) {
    console.error('Error fetching llamados:', error.message);
    return [];
  }
}

async function extractNews() {
  console.log('Starting news and llamados extraction...');
  
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const results = await Promise.allSettled(sites.map(fetchFromSite));
  
  let allNews = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Successfully fetched ${result.value.length} items from ${sites[index].name}`);
      allNews = allNews.concat(result.value);
    } else {
      console.error(`Failed to fetch from ${sites[index].name}:`, result.reason);
    }
  });

  // Unique news by URL
  const uniqueNews = Array.from(new Map(allNews.map(item => [item.url, item])).values());

  const newsOutputPath = path.join(process.cwd(), 'public', 'data', 'news.json');
  fs.writeFileSync(newsOutputPath, JSON.stringify(uniqueNews, null, 2));
  console.log(`Successfully saved ${uniqueNews.length} news items to ${newsOutputPath}`);

  // Extract Llamados
  const llamados = await fetchLlamados();
  const llamadosOutputPath = path.join(process.cwd(), 'public', 'data', 'llamados.json');
  fs.writeFileSync(llamadosOutputPath, JSON.stringify(llamados, null, 2));
  console.log(`Successfully saved ${llamados.length} llamados to ${llamadosOutputPath}`);
}

extractNews().catch(err => {
  console.error('Fatal error during extraction:', err);
  process.exit(1);
});
