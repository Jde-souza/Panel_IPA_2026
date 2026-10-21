# Arquitectura y Stack Tecnológico — Panel IPA 2026

## 1. Resumen del Sistema
**Panel IPA 2026** es una plataforma web integral de gestión, consulta y cartelería digital para el **Instituto de Profesores Artigas (IPA)** en Montevideo, Uruguay (perteneciente al CFE - ANEP). Permite a estudiantes, docentes y funcionarios (Bedelía / DOE) consultar y administrar horarios, mesas de examen, inasistencias docentes, agenda de contactos, adscriptos (DOE), directorio de centros del CFE y noticias institucionales.

---

## 2. Stack Tecnológico

### Frontend (Raíz del proyecto)
* **Framework:** Angular `^21.2.0` (Arquitectura 100% Standalone Components).
* **Estilos:** Tailwind CSS `^3.4.19` + CSS Custom Properties nativas en `src/styles.css`.
* **Iconografía:** Font Awesome 6 (cargado globalmente vía CDN en `src/index.html`).
* **Tipografía:** `Source Sans Pro` (identidad visual institucional ANEP).
* **Reactividad:** Mezcla de Angular Signals (`signal()`) en servicios/componentes modernos y `firstValueFrom(Observable)` / `subscribe()` con `HttpClient`.

### Backend (`backend/`)
* **Entorno:** Node.js + Express `^5.2.1` (`backend/server.js`).
* **Base de Datos:** SQLite3 (`sqlite3` + wrapper `sqlite` con promesas) almacenada en `backend/database.sqlite`.
* **Middleware:** `cors` y `express.json()`.
* **Puerto por defecto:** `3000` (`http://localhost:3000/api`).

### Scripts de Extracción / Scraping (Raíz del proyecto)
* **Librerías:** `axios`, `cheerio` (scraping HTML/RSS), `xlsx` (lectura de Google Sheets exportados como `.xlsx` o `.csv`).

---

## 3. Estructura de Directorios

```text
Panel IPA 2026/
├── ai-context/                  # Documentación técnica para agentes de IA
├── backend/                     # Servidor API REST y Base de Datos
│   ├── database.js              # Inicialización de tablas SQLite
│   ├── database.sqlite          # Archivo de base de datos SQLite activo
│   ├── seed.js                  # Script para poblar SQLite desde public/data/*.json
│   ├── server.js                # API Express (CRUD completo en puerto 3000)
│   └── package.json             # Dependencias del backend
├── public/
│   └── data/                    # Archivos JSON generados por los scrapers
│       ├── agenda.json
│       ├── examenes.json
│       ├── horarios.json
│       ├── inasistencias.json
│       ├── llamados.json
│       └── news.json
├── src/                         # Código fuente Frontend Angular
│   ├── index.html               # HTML raíz (incluye FontAwesome y Google Fonts)
│   ├── main.ts                  # Bootstrap de Angular
│   ├── styles.css               # Variables CSS ANEP, Grid Layout, Dark Mode y Responsive
│   └── app/
│       ├── app.ts               # Componente raíz (Grid layout, Bottom Nav móvil, Toast Container, ARIA Live)
│       ├── app.config.ts        # Configuración de Router y HttpClient
│       ├── app.routes.ts        # Definición de rutas de la SPA
│       ├── data.service.ts      # Servicio central de datos (API REST + JSONs + datos estáticos DOE/Centros)
│       ├── services/
│       │   ├── accessibility.service.ts # Anuncios ARIA Live y gestión de foco
│       │   ├── alert.service.ts         # Notificaciones Toast reactivas con Signals
│       │   └── theme.service.ts         # Cambio entre modo claro y oscuro (data-theme="dark")
│       └── components/
│           ├── home/            # Inicio: Accesos rápidos, Noticias y Llamados
│           ├── horarios/        # Grilla y CRUD de horarios por especialidad/grupo/semestre
│           ├── examenes/        # Dashboard, filtros y CRUD de mesas de exámenes
│           ├── inasistencias/   # KPIs, filtros y CRUD de inasistencias docentes
│           ├── agenda/          # Directorio docente, cálculo de próxima clase y CRUD
│           ├── doe/             # Directorio de adscriptos (DOE) por turno
│           ├── doe-card/        # Tarjeta individual de funcionario DOE
│           ├── centros/         # Directorio nacional de institutos CFE (IFD, CeRP, IPES, INET, IPA)
│           ├── centro-card/     # Tarjeta individual de centro educativo
│           ├── settings/        # Configuración global (año, semestre, especialidades, materias, salones por piso)
│           ├── header/          # Cabecera superior sticky con buscador/controles y toggle de tema
│           ├── sidebar/         # Navegación lateral izquierda (desktop)
│           └── footer/          # Pie de página institucional
├── extract_agenda.js            # Scraper de nómina docente + cruce con horarios
├── extract_examenes.js          # Scraper de planilla de exámenes
├── extract_horarios.js          # Scraper de planilla de horarios por especialidad
├── extract_inasistencias.js     # Scraper de planilla de licencias/inasistencias
├── extract_news.js              # Scraper de noticias (ANEP, CFE, DGEIP, DGES, UTU, Ceibal) y llamados
├── iniciar.bat                  # Lanzador local (Backend + Frontend)
└── update_all_data.bat          # Ejecuta todos los scrapers y compila Angular
```

---

## 4. Flujo de Datos Híbrido (Importante para Agentes)

El sistema utiliza **tres orígenes de datos distintos** según el módulo en `DataService` (`src/app/data.service.ts`):

1. **Datos Dinámicos en Base de Datos SQLite (`http://localhost:3000/api/*`):**
   * **Horarios** (`/api/horarios`)
   * **Exámenes** (`/api/examenes`)
   * **Inasistencias** (`/api/inasistencias`)
   * **Agenda Docente** (`/api/agenda`)
   * **Contactos** (`/api/contactos`)
   * **Configuración del Sistema** (`/api/configuracion`)
   * *Nota:* Estos módulos soportan **CRUD completo** (Crear, Leer, Editar, Eliminar) desde la interfaz de Angular.

2. **Datos Semiestáticos por Scraping (`public/data/*.json`):**
   * **Noticias** (`data/news.json`) y **Llamados** (`data/llamados.json`) son leídos directamente como archivos estáticos por el frontend (`HomeComponent`) y actualizados mediante `node extract_news.js`.
   * Los demás scripts `extract_*.js` también generan archivos en `public/data/` (`horarios.json`, `inasistencias.json`, `examenes.json`, `agenda.json`), los cuales sirven como respaldo estático o para poblar la base de datos SQLite mediante `backend/seed.js`.

3. **Datos Estáticos en Memoria (`DataService`):**
   * **DOE (`rawDoeData`):** Lista de adscriptos, turnos, horarios y correos de bedelía por departamento.
   * **Centros (`centrosData`):** Lista de 37 centros de formación docente de todo el país (IFD, CeRP, Institutos).
   * **Accesos Rápidos (`quickLinks`):** Enlaces a SGE, Moodle CFE, Bedelía, Resoluciones, etc.
