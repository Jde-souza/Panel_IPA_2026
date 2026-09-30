const express = require('express');
const cors = require('cors');
const dbPromise = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Rutas de Horarios ---
app.get('/api/horarios', async (req, res) => {
  try {
    const db = await dbPromise;
    const horarios = await db.all('SELECT * FROM horarios');
    res.json(horarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/horarios', async (req, res) => {
  const { especialidad, semestre, grupo, materia, docente, dia, hora_inicio, hora_fin, salon } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      INSERT INTO horarios (especialidad, semestre, grupo, materia, docente, dia, hora_inicio, hora_fin, salon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [especialidad, semestre, grupo, materia, docente, dia, hora_inicio, hora_fin, salon]);
    res.status(201).json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/horarios/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const result = await db.run('DELETE FROM horarios WHERE id = ?', req.params.id);
    res.json({ success: result.changes > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/horarios/:id', async (req, res) => {
  const { especialidad, semestre, grupo, materia, docente, dia, hora_inicio, hora_fin, salon } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      UPDATE horarios SET especialidad=?, semestre=?, grupo=?, materia=?, docente=?, dia=?, hora_inicio=?, hora_fin=?, salon=?
      WHERE id = ?
    `, [especialidad, semestre, grupo, materia, docente, dia, hora_inicio, hora_fin, salon, req.params.id]);
    res.json({ success: result.changes > 0, id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Rutas de Contactos Docentes ---
app.get('/api/contactos', async (req, res) => {
  try {
    const db = await dbPromise;
    const contactos = await db.all('SELECT * FROM contactos');
    res.json(contactos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contactos', async (req, res) => {
  const { nombre, apellido, email, telefono, departamento, observaciones } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      INSERT INTO contactos (nombre, apellido, email, telefono, departamento, observaciones)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nombre, apellido, email, telefono, departamento, observaciones]);
    res.status(201).json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/contactos/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const result = await db.run('DELETE FROM contactos WHERE id = ?', req.params.id);
    res.json({ success: result.changes > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/contactos/:id', async (req, res) => {
  const { nombre, apellido, email, telefono, departamento, observaciones } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      UPDATE contactos SET nombre=?, apellido=?, email=?, telefono=?, departamento=?, observaciones=?
      WHERE id = ?
    `, [nombre, apellido, email, telefono, departamento, observaciones, req.params.id]);
    res.json({ success: result.changes > 0, id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Rutas de Inasistencias ---
app.get('/api/inasistencias', async (req, res) => {
  try {
    const db = await dbPromise;
    const inasistencias = await db.all('SELECT * FROM inasistencias ORDER BY id DESC');
    res.json(inasistencias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inasistencias', async (req, res) => {
  const { 
    nombre, apellido, email, cedula, fecha_inicio, fecha_fin, 
    grupos, asignatura1, asignatura2, asignatura3, asignatura4, 
    causal, marca_temporal 
  } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      INSERT INTO inasistencias (
        nombre, apellido, email, cedula, fecha_inicio, fecha_fin, 
        grupos, asignatura1, asignatura2, asignatura3, asignatura4, 
        causal, marca_temporal
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre, apellido, email, cedula, fecha_inicio, fecha_fin, 
      grupos, asignatura1, asignatura2, asignatura3, asignatura4, 
      causal, marca_temporal || new Date().toISOString()
    ]);
    res.status(201).json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/inasistencias/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const result = await db.run('DELETE FROM inasistencias WHERE id = ?', req.params.id);
    res.json({ success: result.changes > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/inasistencias/:id', async (req, res) => {
  const { 
    nombre, apellido, email, cedula, fecha_inicio, fecha_fin, 
    grupos, asignatura1, asignatura2, asignatura3, asignatura4, 
    causal, marca_temporal 
  } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      UPDATE inasistencias SET 
        nombre=?, apellido=?, email=?, cedula=?, fecha_inicio=?, fecha_fin=?, 
        grupos=?, asignatura1=?, asignatura2=?, asignatura3=?, asignatura4=?, 
        causal=?, marca_temporal=?
      WHERE id = ?
    `, [
      nombre, apellido, email, cedula, fecha_inicio, fecha_fin, 
      grupos, asignatura1, asignatura2, asignatura3, asignatura4, 
      causal, marca_temporal || new Date().toISOString(), req.params.id
    ]);
    res.json({ success: result.changes > 0, id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Rutas de Exámenes ---
app.get('/api/examenes', async (req, res) => {
  try {
    const db = await dbPromise;
    const examenes = await db.all('SELECT * FROM examenes ORDER BY id DESC');
    res.json(examenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/examenes', async (req, res) => {
  const { dia, hora, examen, anio, plan, tribunal1, tribunal2, tribunal3, salones } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      INSERT INTO examenes (dia, hora, examen, anio, plan, tribunal1, tribunal2, tribunal3, salones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [dia, hora, examen, anio, plan, tribunal1, tribunal2, tribunal3, salones]);
    res.status(201).json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/examenes/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const result = await db.run('DELETE FROM examenes WHERE id = ?', req.params.id);
    res.json({ success: result.changes > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/examenes/:id', async (req, res) => {
  const { dia, hora, examen, anio, plan, tribunal1, tribunal2, tribunal3, salones } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      UPDATE examenes SET dia=?, hora=?, examen=?, anio=?, plan=?, tribunal1=?, tribunal2=?, tribunal3=?, salones=?
      WHERE id = ?
    `, [dia, hora, examen, anio, plan, tribunal1, tribunal2, tribunal3, salones, req.params.id]);
    res.json({ success: result.changes > 0, id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Rutas de Agenda ---
app.get('/api/agenda', async (req, res) => {
  try {
    const db = await dbPromise;
    const agendaRows = await db.all('SELECT * FROM agenda ORDER BY id DESC');
    
    // Parse JSON fields
    const agenda = agendaRows.map(row => ({
      ...row,
      especialidades: JSON.parse(row.especialidades || '[]'),
      asignaturas: JSON.parse(row.asignaturas || '[]'),
      grupos: JSON.parse(row.grupos || '[]'),
      horarios: JSON.parse(row.horarios || '[]'),
      isTachado: row.isTachado === 1
    }));
    
    res.json(agenda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agenda', async (req, res) => {
  const { nombre, telefono1, telefono2, email, especialidades, asignaturas, grupos, caracter, observacion, isTachado, horarios } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      INSERT INTO agenda (nombre, telefono1, telefono2, email, especialidades, asignaturas, grupos, caracter, observacion, isTachado, horarios)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre, 
      telefono1, 
      telefono2, 
      email, 
      JSON.stringify(especialidades || []), 
      JSON.stringify(asignaturas || []), 
      JSON.stringify(grupos || []), 
      caracter, 
      observacion, 
      isTachado ? 1 : 0, 
      JSON.stringify(horarios || [])
    ]);
    res.status(201).json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/agenda/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const result = await db.run('DELETE FROM agenda WHERE id = ?', req.params.id);
    res.json({ success: result.changes > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/agenda/:id', async (req, res) => {
  const { nombre, telefono1, telefono2, email, especialidades, asignaturas, grupos, caracter, observacion, isTachado, horarios } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(`
      UPDATE agenda SET nombre=?, telefono1=?, telefono2=?, email=?, especialidades=?, asignaturas=?, grupos=?, caracter=?, observacion=?, isTachado=?, horarios=?
      WHERE id = ?
    `, [
      nombre, 
      telefono1, 
      telefono2, 
      email, 
      JSON.stringify(especialidades || []), 
      JSON.stringify(asignaturas || []), 
      JSON.stringify(grupos || []), 
      caracter, 
      observacion, 
      isTachado ? 1 : 0, 
      JSON.stringify(horarios || []),
      req.params.id
    ]);
    res.json({ success: result.changes > 0, id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Rutas de Configuración ---
app.get('/api/configuracion', async (req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all('SELECT * FROM configuracion');
    // Convert to key-value object
    const config = {};
    rows.forEach(row => {
      try {
        config[row.clave] = JSON.parse(row.valor);
      } catch {
        config[row.clave] = row.valor;
      }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/configuracion', async (req, res) => {
  const settings = req.body; // Expects an object with key-value pairs
  try {
    const db = await dbPromise;
    await db.exec('BEGIN TRANSACTION');
    for (const [clave, valor] of Object.entries(settings)) {
      const valorStr = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
      await db.run(`
        INSERT INTO configuracion (clave, valor)
        VALUES (?, ?)
        ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
      `, [clave, valorStr]);
    }
    await db.exec('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await (await dbPromise).exec('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
