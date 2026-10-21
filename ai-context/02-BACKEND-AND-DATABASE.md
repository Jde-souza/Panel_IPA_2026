# Backend y Base de Datos SQLite — Panel IPA 2026

El backend se encuentra en `backend/server.js` y la definición de tablas en `backend/database.js`. Utiliza SQLite (`backend/database.sqlite`).

---

## 1. Esquema de Tablas y Peculiaridades

### 1.1. Tabla `horarios`
Almacena cada bloque horario de clase de forma plana.
```sql
CREATE TABLE IF NOT EXISTS horarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  especialidad TEXT,
  semestre TEXT,       -- 'sem1' o 'sem2'
  grupo TEXT,          -- Ej: '1ºA', '2ºB'
  materia TEXT,
  docente TEXT,
  dia TEXT,            -- '1' (Lunes) a '5' (Viernes)
  hora_inicio TEXT,    -- Ej: '08:00'
  hora_fin TEXT,       -- Ej: '08:45'
  salon TEXT
)
```
* **Transformación en Frontend (`HorariosComponent`):** El backend devuelve filas planas (`SELECT * FROM horarios`), y el frontend las agrupa dinámicamente en un árbol `rawData[especialidad][grupo][semestre]` y concatena `hora_inicio` y `hora_fin` como `"HH:MM-HH:MM"`.

---

### 1.2. Tabla `inasistencias`
Almacena los avisos de inasistencia docente.
```sql
CREATE TABLE IF NOT EXISTS inasistencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  apellido TEXT,
  email TEXT,
  cedula TEXT,
  fecha_inicio TEXT,   -- Formato habitual: 'DD/MM/YYYY'
  fecha_fin TEXT,      -- Formato habitual: 'DD/MM/YYYY'
  grupos TEXT,
  asignatura1 TEXT,
  asignatura2 TEXT,
  asignatura3 TEXT,
  asignatura4 TEXT,
  causal TEXT,
  marca_temporal TEXT
)
```
* **Transformación crítica:**
  * En la BD existen 4 columnas separadas (`asignatura1` a `asignatura4`).
  * Al leer en `InasistenciasComponent`, se unifican en un arreglo: `asignaturas: [row.asignatura1, row.asignatura2, row.asignatura3, row.asignatura4].filter(Boolean)`.
  * Al guardar (`POST`/`PUT`), el frontend separa el string ingresado por comas y mapea los primeros 4 elementos a `asignatura1..4`.
  * Los nombres de columna de fecha en BD son `fecha_inicio` y `fecha_fin`, mientras que en la interfaz de componente se mapean a `inicio` y `fin`.

---

### 1.3. Tabla `examenes`
Almacena las mesas de examen.
```sql
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
```
* **Transformación crítica:**
  * En la BD los docentes del tribunal están separados en `tribunal1`, `tribunal2`, `tribunal3`.
  * En `ExamenesComponent`, al recibir los datos se agrupan en `tribunal: [row.tribunal1, row.tribunal2, row.tribunal3].filter(Boolean)`.
  * Al enviar (`POST`/`PUT`), el formulario divide `tribunalesStr` por comas y envía `tribunal1`, `tribunal2`, `tribunal3`.

---

### 1.4. Tabla `agenda`
Almacena el directorio de docentes y sus horarios asociados.
```sql
CREATE TABLE IF NOT EXISTS agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,         -- Formato estándar: 'Apellido, Nombre'
  telefono1 TEXT,
  telefono2 TEXT,
  email TEXT,
  especialidades TEXT, -- JSON Array stringificado: '["Historia", ...]'
  asignaturas TEXT,    -- JSON Array stringificado
  grupos TEXT,         -- JSON Array stringificado
  caracter TEXT,       -- Ej: 'Efectivo', 'Interino'
  observacion TEXT,
  isTachado INTEGER,   -- 0 o 1
  horarios TEXT        -- JSON Array stringificado de objetos {dia, hora, salon, grupo, asignatura}
)
```
* **Transformación en Backend (`server.js`):**
  * El endpoint `GET /api/agenda` hace `JSON.parse()` automáticamente sobre `especialidades`, `asignaturas`, `grupos` y `horarios`, y convierte `isTachado === 1` a booleano antes de responder al cliente.
  * Los endpoints `POST` y `PUT` hacen `JSON.stringify()` de esos 4 arreglos y convierten `isTachado ? 1 : 0`.

---

### 1.5. Tabla `configuracion`
Almacena pares clave-valor de configuración global del sistema.
```sql
CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT           -- Valores simples o estructuras JSON stringificadas
)
```
* **Claves utilizadas actualmente (`SettingsComponent`):**
  * `anoLectivo`: string (ej. `'2026'`)
  * `semestreActual`: `'sem1'` | `'sem2'`
  * `especialidades`: Array de objetos `{ nombre: string, materias: string[] }`
  * `materias`: Array global de objetos `{ nombre: string, anios: string[], anio?: string }` (catálogo maestro de asignaturas con selección múltiple de años: `'1º Año'`, `'2º Año'`, `'3º Año'`, `'4º Año'`; soporta combinaciones como 2º a 4º año o `'Todos los años'`)
  * `salones`: Array de objetos `{ nombre: string, piso: string, capacidad: number | null, recursos: string }`
  * `pisos`: Array de strings `string[]` (ej. `['Sub suelo', 'Planta baja', 'Primer piso', 'Segundo piso']`)
  * `planes`: Array de strings `string[]` (ej. planes de estudio para exámenes)
  * `causales`: Array de strings `string[]` (causales de licencia/inasistencia)
* **Funcionamiento de `/api/configuracion`:**
  * `GET /api/configuracion`: Devuelve un único objeto JSON `{ [clave]: valorParseado }`.
  * `POST /api/configuracion`: Recibe un objeto con múltiples claves y ejecuta un `INSERT ... ON CONFLICT(clave) DO UPDATE` dentro de una transacción SQLite.

---

### 1.6. Tabla `contactos`
Tabla auxiliar para contactos generales (`/api/contactos`).
```sql
CREATE TABLE IF NOT EXISTS contactos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  apellido TEXT,
  email TEXT,
  telefono TEXT,
  departamento TEXT,
  observaciones TEXT
)
```

---

## 2. Resumen de Endpoints REST (`backend/server.js`)

Todos los recursos principales exponen la misma estructura RESTful estándar:

| Recurso | GET (Listar) | POST (Crear) | PUT (Actualizar) | DELETE (Eliminar) |
| :--- | :--- | :--- | :--- | :--- |
| **Horarios** | `/api/horarios` | `/api/horarios` | `/api/horarios/:id` | `/api/horarios/:id` |
| **Inasistencias** | `/api/inasistencias` | `/api/inasistencias` | `/api/inasistencias/:id` | `/api/inasistencias/:id` |
| **Exámenes** | `/api/examenes` | `/api/examenes` | `/api/examenes/:id` | `/api/examenes/:id` |
| **Agenda** | `/api/agenda` | `/api/agenda` | `/api/agenda/:id` | `/api/agenda/:id` |
| **Contactos** | `/api/contactos` | `/api/contactos` | `/api/contactos/:id` | `/api/contactos/:id` |
| **Configuración** | `/api/configuracion` | `/api/configuracion` (Upsert masivo) | *(Usa POST)* | *(N/A)* |
