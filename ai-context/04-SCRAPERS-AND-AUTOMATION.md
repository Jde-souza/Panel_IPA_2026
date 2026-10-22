# Scrapers, Orígenes de Datos y Automatización — Panel IPA 2026

El proyecto cuenta con 5 scripts de extracción en Node.js ubicados en la raíz del proyecto que descargan datos desde fuentes oficiales (Google Sheets de Bedelía IPA y portales web de ANEP/CFE) y generan archivos JSON en `public/data/`.

---

## 1. Detalle de los Scripts Extractores

### 1.1. `extract_news.js` (`npm run extract:news`)
* **Propósito:** Extrae noticias institucionales y llamados a concursos/aspiraciones.
* **Orígenes de Noticias:**
  * **ANEP:** `https://www.anep.edu.uy/`
  * **CFE:** `https://www.cfe.edu.uy/`
  * **DGEIP:** `https://www.dgeip.edu.uy/documentos/2025/portal/index.html`
  * **DGES:** `https://www.dges.edu.uy/`
  * **UTU:** `https://www.utu.edu.uy/feed/` (RSS XML)
  * **CEIBAL:** `https://ceibal.edu.uy/institucional/articulos/`
* **Origen de Llamados:** `https://www.anep.edu.uy/llamados` (clasifica automáticamente cada llamado en `docente` o `no-docente` por palabras clave).
* **Salidas:** `public/data/news.json` y `public/data/llamados.json`.

### 1.2. `extract_horarios.js` (`npm run extract:horarios`)
* **Propósito:** Descarga la planilla maestra de horarios del IPA desde Google Sheets (`.xlsx`) y procesa tanto pestañas con formato de grilla semanal (`sem1` en columnas 1-5 y `sem2` en columnas 8-12), como pestañas de paquetes (`Paquete`) y pestañas en formato lista (`Seminarios de Apr. e Inc.`, `Acompañamiento a la Lengua Espa`, `Taller de producción escrita`, `Optativas`).
* **Salida:** `public/data/horarios.json`.

### 1.3. `extract_inasistencias.js` (`npm run extract:inasistencias`)
* **Propósito:** Descarga las respuestas del formulario de inasistencias docentes desde Google Sheets (`.csv`), normalizando fechas en formato europeo `DD/MM/YYYY` y agrupando las columnas dinámicas de asignaturas.
* **Salida:** `public/data/inasistencias.json`.

### 1.4. `extract_agenda.js` (`npm run extract:agenda`)
* **Propósito:** Descarga 6 pestañas (GIDs de 1º a 4º año, Hoja 1 y Talleres) de la nómina docente en Google Sheets, normaliza los nombres al formato `"Apellido, Nombre"`, consolida teléfonos/emails/grupos/especialidades y **cruza los datos con `public/data/horarios.json`** por coincidencia de apellido para adjuntar a cada docente sus horarios semanales de clase.
* **Dependencia importante:** Debe ejecutarse **después** de `extract_horarios.js` para que el cruce de horarios funcione con datos frescos.
* **Salida:** `public/data/agenda.json`.

### 1.5. `extract_examenes.js` (`npm run extract:examenes`)
* **Propósito:** Descarga la planilla de mesas de exámenes desde Google Sheets (`.xlsx`), detecta dinámicamente la fila de encabezados y extrae día, hora, asignatura (`examen`), año, plan, hasta 3 miembros de tribunal y salones.
* **Salida:** `public/data/examenes.json`.

### 1.6. `extract_carreras.js` (`npm run extract:carreras`)
* **Propósito:** Extrae las **22 especialidades vigentes de Profesor de Educación Media** (Plan 2023 + Reformulaciones 2025) y sus **369 Unidades Curriculares (materias)** organizadas por año (`1º Año` a `4º Año`) y trayecto formativo (`TFEE`, `TFDPP`, `TFE`, `TFLD`, `Optativo`) directamente desde el portal oficial del CFE (`https://cfe.edu.uy/index.php/carreras/planes-y-programas2/planes-vigentes-para-profesorado`).
* **Sincronización:** Además de generar `public/data/carreras.json` (que alimenta también a `extract_horarios.js` para reconocer nombres de asignaturas en celdas de la planilla), actualiza automáticamente la tabla `configuracion` (`especialidades`, `materias`, `planes`) en `backend/database.sqlite`.
* **Salida:** `public/data/carreras.json` y actualización en `backend/database.sqlite`.

---

## 2. Sincronización entre Scrapers (`public/data/*.json`) y SQLite (`backend/database.sqlite`)

> **⚠️ Atención Agentes:**
> * Los scripts `extract_*.js` actualizan los archivos en `public/data/*.json`.
> * Sin embargo, los componentes `Horarios`, `Examenes`, `Inasistencias` y `Agenda` en Angular leen sus datos desde el backend SQLite (`http://localhost:3000/api/*`).
> * Para volcar los datos recién extraídos de `public/data/*.json` hacia `backend/database.sqlite`, se utiliza el script `backend/seed.js` (teniendo en cuenta que `seed.js` hace `INSERT` sin vaciar previamente las tablas, por lo que si se desea recargar desde cero se debe limpiar la tabla correspondiente antes de re-seedear).

---

## 3. Scripts Batch y Automatización

* **`iniciar.bat`:** Abre dos ventanas de consola en Windows: una ejecutando `cd backend && npm run dev` y otra ejecutando `npm start` (Angular CLI).
* **`update_all_data.bat`:** Ejecuta en secuencia `extract_news.js`, `extract_inasistencias.js`, `extract_horarios.js`, `extract_agenda.js` y finalmente compila la aplicación con `npm run build`.
* **`.github/workflows/update-news.yml` y `build.yml`:** Workflows de GitHub Actions para actualizar automáticamente las noticias/llamados y compilar/validar la aplicación Angular en CI.
