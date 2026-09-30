const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

async function seed() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log('Seeding horarios...');
  const horariosFile = path.join(__dirname, '../public/data/horarios.json');
  if (fs.existsSync(horariosFile)) {
    const rawData = JSON.parse(fs.readFileSync(horariosFile, 'utf-8'));
    await db.exec('BEGIN TRANSACTION');
    for (const esp of Object.keys(rawData)) {
      for (const grupo of Object.keys(rawData[esp])) {
        for (const sem of ['sem1', 'sem2']) {
          const clases = rawData[esp][grupo][sem] || [];
          for (const c of clases) {
            await db.run(`
              INSERT INTO horarios (especialidad, semestre, grupo, materia, docente, dia, hora_inicio, hora_fin, salon)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              esp, 
              sem, 
              grupo, 
              c.materia || '', 
              c.docente || '', 
              c.dia ? c.dia.toString() : '1',
              c.hora ? c.hora.split('-')[0] : '', 
              c.hora ? c.hora.split('-')[1] : '', 
              c.salon || ''
            ]);
          }
        }
      }
    }
    await db.exec('COMMIT');
    console.log('Horarios seeded!');
  }

  console.log('Seeding inasistencias...');
  const inasistenciasFile = path.join(__dirname, '../public/data/inasistencias.json');
  if (fs.existsSync(inasistenciasFile)) {
    const data = JSON.parse(fs.readFileSync(inasistenciasFile, 'utf-8'));
    await db.exec('BEGIN TRANSACTION');
    for (const row of data) {
      await db.run(`
        INSERT INTO inasistencias (
          nombre, apellido, email, cedula, fecha_inicio, fecha_fin, 
          grupos, asignatura1, asignatura2, asignatura3, asignatura4, 
          causal, marca_temporal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        row.nombre || '', 
        row.apellido || '', 
        row.email || '', 
        '', 
        row.inicio || '', 
        row.fin || '', 
        row.grupos || '', 
        row.asignaturas && row.asignaturas[0] ? row.asignaturas[0] : '', 
        row.asignaturas && row.asignaturas[1] ? row.asignaturas[1] : '', 
        row.asignaturas && row.asignaturas[2] ? row.asignaturas[2] : '', 
        row.asignaturas && row.asignaturas[3] ? row.asignaturas[3] : '', 
        '', 
        row.timestamp || new Date().toISOString()
      ]);
    }
    await db.exec('COMMIT');
    console.log('Inasistencias seeded!');
  }

  console.log('Seeding examenes...');
  const examenesFile = path.join(__dirname, '../public/data/examenes.json');
  if (fs.existsSync(examenesFile)) {
    const data = JSON.parse(fs.readFileSync(examenesFile, 'utf-8'));
    await db.exec('BEGIN TRANSACTION');
    for (const ex of data) {
      await db.run(`
        INSERT INTO examenes (dia, hora, examen, anio, plan, tribunal1, tribunal2, tribunal3, salones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ex.dia || '',
        ex.hora || '',
        ex.examen || '',
        ex.anio || '',
        ex.plan || '',
        ex.tribunal && ex.tribunal[0] ? ex.tribunal[0] : '',
        ex.tribunal && ex.tribunal[1] ? ex.tribunal[1] : '',
        ex.tribunal && ex.tribunal[2] ? ex.tribunal[2] : '',
        ex.salones || ''
      ]);
    }
    await db.exec('COMMIT');
    console.log('Examenes seeded!');
  }

  console.log('Seeding agenda...');
  const agendaFile = path.join(__dirname, '../public/data/agenda.json');
  if (fs.existsSync(agendaFile)) {
    const data = JSON.parse(fs.readFileSync(agendaFile, 'utf-8'));
    await db.exec('BEGIN TRANSACTION');
    for (const row of data) {
      await db.run(`
        INSERT INTO agenda (nombre, telefono1, telefono2, email, especialidades, asignaturas, grupos, caracter, observacion, isTachado, horarios)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        row.nombre || '',
        row.telefono1 || '',
        row.telefono2 || '',
        row.email || '',
        JSON.stringify(row.especialidades || []),
        JSON.stringify(row.asignaturas || []),
        JSON.stringify(row.grupos || []),
        row.caracter || '',
        row.observacion || '',
        row.isTachado ? 1 : 0,
        JSON.stringify(row.horarios || [])
      ]);
    }
    await db.exec('COMMIT');
    console.log('Agenda seeded!');
  }

  console.log('Seeding complete.');
}

seed().catch(console.error);
