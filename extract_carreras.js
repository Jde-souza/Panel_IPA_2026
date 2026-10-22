const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const fs = require('fs');
const path = require('path');

const MAIN_URL = 'https://cfe.edu.uy/index.php/carreras/planes-y-programas2/planes-vigentes-para-profesorado';
const BASE_URL = 'https://cfe.edu.uy';
const OUTPUT_PATH = path.join(__dirname, 'public', 'data', 'carreras.json');
const DB_PATH = path.join(__dirname, 'backend', 'database.sqlite');

const agent = new https.Agent({ rejectUnauthorized: false });

const VALID_TRAYECTOS = new Set(['TFEE', 'TFDPP', 'TFLDPP', 'TFE', 'TFLD']);
const ORDEN_ANIOS = ['1º Año', '2º Año', '3º Año', '4º Año'];

// Normalización de erratas menores presentes en las tablas HTML del portal CFE
// y unificación de mayúsculas/minúsculas en asignaturas compartidas
const CANONICAL_MATERIA_MAP = {
  'introducción al campo profesional': 'Introducción al campo profesional',
  'la educación y sus transformaciones en la historia': 'La Educación y sus transformaciones en la historia',
  'teorías pedagógicas': 'Teorías pedagógicas',
  'desarrollo humano integral': 'Desarrollo Humano Integral',
  'educación, sociedad y cultura': 'Educación, Sociedad y Cultura',
  'lengua española i': 'Lengua Española I',
  'lengua española ii': 'Lengua Española II',
  'idioma español i': 'Lengua Española I',
  'idioma español ii': 'Lengua Española II',
  'sistema educativo nacional: políticas educativas': 'Sistema Educativo Nacional: Políticas Educativas',
  'sistema educativo nacional: marco normativo y gestión institucional': 'Sistema Educativo Nacional: marco normativo y gestión institucional',
  'aprendizaje, neurociencias y procesos socioafectivos': 'Aprendizaje, neurociencias y procesos socioafectivos',
  'didáctica práctica docente i': 'Didáctica Práctica Docente I',
  'didáctica práctica docente ii': 'Didáctica Práctica Docente II',
  'didáctica práctica docente iii': 'Didáctica Práctica Docente III',
  'tecnologías multimediales': 'Tecnologías multimediales',
  'pensamiento computacional': 'Pensamiento computacional',
  'problemas epistemológicos y pensamiento científico': 'Problemas epistemológicos y pensamiento científico',
  'investigación educativa aplicada: diseño de proyectos': 'Investigación Educativa Aplicada: diseño de proyectos',
  'proyectos': 'Investigación Educativa Aplicada: diseño de proyectos', // Errata en tabla de Comunicación Visual 3º Año (TFEE)
  'filosofía de la educación': 'Filosofía de la Educación',
  'investigación educativa aplicada: desarrollo y evaluación de proyectos': 'Investigación Educativa Aplicada: desarrollo y evaluación de proyectos',
  'lengua extranjera i': 'Lengua Extranjera I',
  'lengua extranjera ii': 'Lengua Extranjera II',
  'unidades curriculares optativas': 'Unidades curriculares optativas',
  'optativas': 'Unidades curriculares optativas',
  'fonética y fonología': 'Fonética y Fonología',
  'aspectos literarios': 'Aspectos Literarios',
  'didáctica de la fonética y evaluación': 'Didáctica de la Fonética y Evaluación',
  'música y danza': 'Música y Danza',
  'literatura italiana ll': 'Literatura Italiana II',
  'metodologías de las danzas iv': 'Metodologías de las Danzas IV',
  'teoría social 1': 'Teoría social I',
  'seminario de investigación interdisciplinario con énfasis enproblemáticas': 'Seminario de investigación interdisciplinario con énfasis en problemáticas',
  'la naturaleza epistemológica de la física. las concepciones einterdisciplinariedad': 'La naturaleza epistemológica de la Física. Las concepciones e interdisciplinariedad'
};

// Denominaciones tradicionales / equivalentes del Tronco Común y Optativas/Talleres utilizadas en grillas de Bedelía IPA
const EQUIVALENCIAS_TRONCO_COMUN_IPA = [
  { nombre: 'Pedagogía', anio: '1º Año' },
  { nombre: 'Psicología del Desarrollo', anio: '1º Año' },
  { nombre: 'Sociología de la Educación 1: Teoría Sociológica', anio: '1º Año' },
  { nombre: 'Taller de Producción Escrita', anio: '1º Año' },
  { nombre: 'Acompañamiento a la Lengua Española', anio: '1º Año' },
  { nombre: 'Psicología de la Educación', anio: '2º Año' },
  { nombre: 'Legislación y Administración de la Enseñanza', anio: '4º Año' },
  { nombre: 'Educación Sexual Integral (Optativa)', anio: '4º Año' },
  { nombre: 'Educación e Inclusión (Optativa)', anio: '4º Año' },
  { nombre: 'Educación en Derechos Humanos (Optativa)', anio: '4º Año' },
  { nombre: 'Lenguaje Audiovisual (Optativa)', anio: '4º Año' },
  { nombre: 'Pedagogía Audiovisual (Optativa)', anio: '4º Año' }
];

function normalizeMateriaName(rawName) {
  if (!rawName) return '';
  const cleaned = String(rawName)
    .replace(/\s+/g, ' ')
    .replace(/\(\*\)/g, '')
    .trim();
  const low = cleaned.toLowerCase();
  if (CANONICAL_MATERIA_MAP[low]) {
    return CANONICAL_MATERIA_MAP[low];
  }
  return cleaned;
}

function formatAniosLabel(anios) {
  const ordenados = ORDEN_ANIOS.filter(a => anios.includes(a));
  if (ordenados.length === 0 || ordenados.length === ORDEN_ANIOS.length) {
    return 'Todos los años';
  }
  if (ordenados.length === 1) {
    return ordenados[0];
  }
  const numeros = ordenados.map(a => a.replace(' Año', ''));
  const ult = numeros.pop();
  return `${numeros.join(', ')} y ${ult} Año`;
}

async function fetchHtml(url) {
  const res = await axios.get(url, {
    httpsAgent: agent,
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  return cheerio.load(res.data);
}

async function extractCarreras() {
  try {
    console.log('--- Iniciando ingesta oficial de Carreras y Materias (Profesorado CFE Plan 2023 / 2025) ---');
    console.log(`Consultando portal oficial: ${MAIN_URL}`);

    const $ = await fetchHtml(MAIN_URL);
    const content = $('.item-page, article, main, #content, .com-content-article__body').first();

    const specialtyLinks = [];
    const seenUrls = new Set();

    content.find('table a').each((i, el) => {
      const linkText = $(el).text().replace(/\s+/g, ' ').trim();
      const href = $(el).attr('href');
      const tdText = $(el).closest('td').text().replace(/\s+/g, ' ').trim();

      if (href && href.includes('plan-2023-profesorado')) {
        const fullUrl = href.startsWith('http') ? href : BASE_URL + href;
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          specialtyLinks.push({
            nombre: tdText || linkText,
            linkText,
            url: fullUrl
          });
        }
      }
    });

    console.log(`Se detectaron ${specialtyLinks.length} especialidades vigentes en el portal CFE.`);

    const especialidadesDetalladas = [];
    const globalMateriasMap = new Map(); // nombre -> Set<anio>

    for (const spec of specialtyLinks) {
      process.stdout.write(`  Procesando especialidad: ${spec.nombre}... `);
      const $sub = await fetchHtml(spec.url);

      let currTable = null;
      $sub('table').each((i, tbl) => {
        if ($sub(tbl).text().includes('Unidad Curricular')) {
          currTable = $sub(tbl);
        }
      });

      if (!currTable) {
        console.log('ADVERTENCIA: No se encontró tabla curricular.');
        continue;
      }

      let currentYear = null;
      let currentTrayecto = '';
      const materiasPorAnio = {
        '1º Año': [],
        '2º Año': [],
        '3º Año': [],
        '4º Año': []
      };
      const detalleCurricular = [];
      const specMateriasSet = new Set();

      currTable.find('tr').each((rIdx, tr) => {
        const cells = [];
        $sub(tr).find('th, td').each((cIdx, td) => {
          cells.push($sub(td).text().replace(/\s+/g, ' ').trim());
        });
        if (cells.length === 0) return;

        // Detectar cambio de año (1º, 2º, 3º, 4º)
        if (/^[1-4][º°]$/.test(cells[0])) {
          currentYear = `${cells[0][0]}º Año`;
        }
        if (!currentYear) return;

        // Ignorar filas de encabezados o totales
        const rowJoined = cells.join(' ').toLowerCase();
        if (
          rowJoined.includes('unidad curricular') ||
          rowJoined.includes('semestre 3') ||
          rowJoined.includes('semestre 5') ||
          rowJoined.includes('semestre 7') ||
          rowJoined.includes('total de créditos')
        ) {
          return;
        }

        // Detectar trayecto si está presente en la fila
        for (const cell of cells) {
          if (VALID_TRAYECTOS.has(cell)) {
            currentTrayecto = cell === 'TFLDPP' ? 'TFDPP' : cell;
            break;
          }
        }

        // Extraer el nombre de la Unidad Curricular
        let ucCandidate = '';
        for (const cell of cells) {
          if (!cell) continue;
          if (/^[1-4][º°]$/.test(cell)) continue;
          if (VALID_TRAYECTOS.has(cell)) continue;
          if (/^\d+$/.test(cell)) continue;
          ucCandidate = cell;
          break;
        }

        const nombreMateria = normalizeMateriaName(ucCandidate);
        if (nombreMateria) {
          if (!materiasPorAnio[currentYear].includes(nombreMateria)) {
            materiasPorAnio[currentYear].push(nombreMateria);
          }
          specMateriasSet.add(nombreMateria);
          detalleCurricular.push({
            nombre: nombreMateria,
            anio: currentYear,
            trayecto: nombreMateria.toLowerCase().includes('optativa') ? 'Optativo' : currentTrayecto
          });

          if (!globalMateriasMap.has(nombreMateria)) {
            globalMateriasMap.set(nombreMateria, new Set());
          }
          globalMateriasMap.get(nombreMateria).add(currentYear);
        }
      });

      // Agregar equivalencias tradicionales del Tronco Común usadas en grillas de Bedelía IPA
      for (const eq of EQUIVALENCIAS_TRONCO_COMUN_IPA) {
        specMateriasSet.add(eq.nombre);
        if (!globalMateriasMap.has(eq.nombre)) {
          globalMateriasMap.set(eq.nombre, new Set());
        }
        globalMateriasMap.get(eq.nombre).add(eq.anio);
      }

      const materiasList = Array.from(specMateriasSet);
      console.log(`OK (${materiasList.length} unidades curriculares)`);

      especialidadesDetalladas.push({
        nombre: spec.nombre,
        url: spec.url,
        plan: spec.nombre.includes('2025') ? '2023 (Reformulación 2025)' : '2023',
        materias: materiasList,
        materiasPorAnio,
        detalleCurricular
      });
    }

    // Cruzar materias entre Derecho (2025) y Derecho / Sociología para que ambas modalidades
    // dispongan de todas las unidades curriculares de 1º a 4º año en grillas compartidas del IPA
    const espDerecho2025 = especialidadesDetalladas.find(e => e.nombre === 'Derecho (2025)');
    const espDerechoSoc = especialidadesDetalladas.find(e => e.nombre === 'Derecho / Sociología');
    if (espDerecho2025 && espDerechoSoc) {
      const unionDerecho = Array.from(new Set([...espDerecho2025.materias, ...espDerechoSoc.materias]));
      espDerecho2025.materias = [...unionDerecho];
      espDerechoSoc.materias = [...unionDerecho];
    }

    // Ordenar especialidades alfabéticamente
    especialidadesDetalladas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    // Construir catálogo global de materias con sus años exactos
    const materiasGlobales = Array.from(globalMateriasMap.entries())
      .map(([nombre, aniosSet]) => {
        const anios = ORDEN_ANIOS.filter(a => aniosSet.has(a));
        return {
          nombre,
          anios,
          anio: formatAniosLabel(anios)
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const planes = ['2023', '2023 (Reformulación 2025)', '2008', '1986'];

    const outputData = {
      fuente: MAIN_URL,
      ultimaActualizacion: new Date().toISOString(),
      planes,
      totalEspecialidades: especialidadesDetalladas.length,
      totalMateriasUnicas: materiasGlobales.length,
      especialidades: especialidadesDetalladas.map(e => ({
        nombre: e.nombre,
        materias: e.materias,
        url: e.url,
        plan: e.plan,
        materiasPorAnio: e.materiasPorAnio
      })),
      materias: materiasGlobales
    };

    if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
      fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2));
    console.log(`\nArchivo guardado exitosamente en: ${OUTPUT_PATH}`);
    console.log(`- Total Especialidades: ${especialidadesDetalladas.length}`);
    console.log(`- Total Materias Globales: ${materiasGlobales.length}`);

    // Sincronizar con SQLite (tabla configuracion) si existe la base de datos
    if (fs.existsSync(DB_PATH)) {
      const sqlite3 = require('./backend/node_modules/sqlite3');
      const { open } = require('./backend/node_modules/sqlite');
      const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

      const especialidadesConfig = especialidadesDetalladas.map(e => ({
        nombre: e.nombre,
        materias: e.materias
      }));

      await db.exec('BEGIN TRANSACTION');
      await db.run(
        `INSERT INTO configuracion (clave, valor) VALUES ('especialidades', ?)
         ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
        [JSON.stringify(especialidadesConfig)]
      );
      await db.run(
        `INSERT INTO configuracion (clave, valor) VALUES ('materias', ?)
         ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
        [JSON.stringify(materiasGlobales)]
      );
      await db.run(
        `INSERT INTO configuracion (clave, valor) VALUES ('planes', ?)
         ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
        [JSON.stringify(planes)]
      );
      await db.exec('COMMIT');
      await db.close();
      console.log('Base de datos SQLite (tabla configuracion: especialidades, materias, planes) actualizada correctamente.');
    }

    console.log('--- Proceso de ingesta de Carreras y Materias completado ---');
  } catch (error) {
    console.error('Error durante la extracción de carreras y materias:', error.message);
    process.exit(1);
  }
}

extractCarreras();
