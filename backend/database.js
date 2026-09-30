const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

let dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database
});

async function initDb() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS horarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      especialidad TEXT,
      semestre TEXT,
      grupo TEXT,
      materia TEXT,
      docente TEXT,
      dia TEXT,
      hora_inicio TEXT,
      hora_fin TEXT,
      salon TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS contactos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      apellido TEXT,
      email TEXT,
      telefono TEXT,
      departamento TEXT,
      observaciones TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS inasistencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      apellido TEXT,
      email TEXT,
      cedula TEXT,
      fecha_inicio TEXT,
      fecha_fin TEXT,
      grupos TEXT,
      asignatura1 TEXT,
      asignatura2 TEXT,
      asignatura3 TEXT,
      asignatura4 TEXT,
      causal TEXT,
      marca_temporal TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS examenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dia TEXT,
      hora TEXT,
      examen TEXT,
      anio TEXT,
      plan TEXT,
      tribunal1 TEXT,
      tribunal2 TEXT,
      tribunal3 TEXT,
      salones TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS agenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      telefono1 TEXT,
      telefono2 TEXT,
      email TEXT,
      especialidades TEXT,
      asignaturas TEXT,
      grupos TEXT,
      caracter TEXT,
      observacion TEXT,
      isTachado INTEGER,
      horarios TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT
    )
  `);

  console.log('Base de datos inicializada correctamente.');
}

initDb();

module.exports = dbPromise;
