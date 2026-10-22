# Componentes Frontend, Servicios y UI/UX — Panel IPA 2026

## 1. Enrutamiento (`src/app/app.routes.ts`)

| Ruta | Componente | Descripción Funcional |
| :--- | :--- | :--- |
| `/home` | `HomeComponent` | Dashboard principal: Accesos rápidos, Noticias de portales educativos y Llamados de ANEP (docentes / no docentes). |
| `/horarios` | `HorariosComponent` | Consulta de horarios por Especialidad -> Grupo (agrupados por turno Mañana/Tarde/Noche) -> Semestre (`sem1`/`sem2`). Incluye vista de grilla en desktop, lista en móvil y modal CRUD conectado a `configuracion`. |
| `/salones` y `/salon/:nombre` | `SalonesComponent` | Directorio de salones en tiempo real y vista de escaneo QR para puertas: informa la clase en curso ahora mismo (o estado libre + próxima clase), alerta si el docente registra inasistencia hoy, cronograma diario, grilla semanal ampliada del salón y generador/impresor de carteles QR (formato Póster individual o Grilla recortable). |
| `/examenes` | `ExamenesComponent` | Dashboard con KPIs de mesas de examen, filtros por texto/plan/año, agrupación por fecha y modal CRUD. |
| `/inasistencias` | `InasistenciasComponent` | Panel de licencias docentes con KPIs (Total, Ausentes hoy, Múltiples días), filtros rápidos y modal CRUD con causales dinámicas. |
| `/agenda` | `AgendaComponent` | Buscador de docentes, copiado rápido al portapapeles, modal de detalle con **cálculo en tiempo real de próxima clase / clase en curso** (`calculateNextClass`), y modal CRUD. |
| `/doe` | `DoeComponent` | Directorio de adscriptos (DOE) agrupados por funcionario con sus respectivos turnos, horarios, especialidades asignadas y correos de bedelía. |
| `/centros` | `CentrosComponent` | Directorio nacional de centros del CFE (IFD, CeRP, Institutos) con filtro por departamento y búsqueda. |
| `/configuracion` | `SettingsComponent` | Administración del sistema con navegación vertical por pestañas (`general`, `especialidades`, `materias`, `salones`, `examenes`, `inasistencias`) y paneles laterales (slide-overs). |
| `/ayuda` | `AyudaComponent` | Centro de Ayuda y Documentación interactivo con buscador en tiempo real, filtros por módulo y perfil (`consulta` / `gestion`), guías paso a paso, preguntas frecuentes (FAQ) e internos del instituto. |

---

## 2. Servicios Globales (`src/app/services/` y `src/app/data.service.ts`)

### 2.1. `DataService` (`src/app/data.service.ts`)
* Centraliza todas las peticiones HTTP hacia `http://localhost:3000/api` y hacia los JSON estáticos en `data/news.json` y `data/llamados.json`.
* Provee también los datos estáticos de `getCentrosData()`, `getQuickLinks()` y `getUnifiedDoeData()`.

### 2.2. `AlertService` (`src/app/services/alert.service.ts`)
* Gestiona una cola reactiva de notificaciones tipo Toast (`alerts = signal<Alert[]>([])`) y un modal global de confirmación (`confirmDialog = signal<ConfirmOptions | null>(null)`).
* Métodos públicos:
  * `alertService.success(message, duration = 3000, title?)`
  * `alertService.error(message, duration = 5000, title?)`
  * `alertService.info(message, duration = 3000, title?)`
  * `alertService.warning(message, duration = 4000, title?)`
  * `await alertService.confirm(options: string | ConfirmOptions): Promise<boolean>`: Abre un modal glassmorphism adaptado al tema claro/oscuro en lugar del `confirm()` nativo del navegador.
* Tanto los toasts como el modal de confirmación se renderizan de forma global en `App` (`src/app/app.ts`).

### 2.3. `AccessibilityService` (`src/app/services/accessibility.service.ts`)
* Gestiona una región `aria-live` centralizada en `App` (`currentAnnouncement` y `currentPriority`).
* `a11y.announce(message, 'polite' | 'assertive')`: Anuncia cambios de página, resultados de búsqueda y acciones de portapapeles para lectores de pantalla.
* `a11y.focusElement(selector)`: Mueve el foco al contenedor principal tras cada navegación.

### 2.4. `ThemeService` (`src/app/services/theme.service.ts`)
* Alterna el modo claro/oscuro sincronizando tanto el atributo `data-theme="dark"` (para variables CSS en `styles.css`) como la clase `.dark` en `document.documentElement` (para utilidades `dark:` de Tailwind) y persistiendo la preferencia en `localStorage`.

---

## 3. Sistema de Diseño y Convenciones UI/UX

### 3.1. Paleta Institucional ANEP (`src/styles.css`)
* `--anep-blue`: `#003087` (Pantone 287 C - Institucional principal)
* `--anep-cyan`: `#00aeef` (Color primario de acento e interactividad)
* `--anep-yellow`: `#ffcc00` (Acento dorado/amarillo)
* `--anep-celeste`: `#0097D7`

### 3.2. Layout y Responsividad
* **Desktop (`> 1024px`):** CSS Grid (`.grid-container`) con `app-header` superior sticky (80px), `app-sidebar` lateral izquierda sticky (280px) y área `main` + `app-footer`.
* **Tablet y Móvil (`<= 1024px`):**
  * Se oculta `app-sidebar`.
  * Se activa la barra de navegación inferior fija (`.mobile-bottom-nav`) definida en `src/app/app.ts`.
  * En `HorariosComponent`, la tabla semanal cambia automáticamente a una vista de tarjetas por día (`clasesList`) en pantallas móviles.

### 3.3. Patrones de Interfaz Recientes
* **Autoguardado en Configuración:** `SettingsComponent` persiste automáticamente en `/api/configuracion` al agregar, editar o eliminar Materias, Especialidades y Salones, así como con debounce (700ms y flush en `ngOnDestroy`) al modificar campos generales (`anoLectivo`, `semestreActual`, `planes`, `causales`, `pisos`).
* **Salones por Piso:** Los salones no son simples strings; son objetos `{ nombre, piso, capacidad, recursos }` agrupados visualmente según los pisos configurados (`Sub suelo`, `Planta baja`, `Primer piso`, `Segundo piso`). Note que `HorariosComponent` soporta tanto el formato objeto como el formato string legado al poblar los selectores de salón.
* **Modal de Exámenes con Desplegables de Catálogo:** El modal de Agregar/Editar Examen integra menús desplegables para todas las opciones posibles (Asignatura con 369 materias y autocompletado de año, Año lectivo, Plan de estudios, Días agendados / selector de fecha en calendario, Horarios de inicio sugeridos, Salón agrupado por pisos desde configuración y 3 selectores independientes para los miembros del Tribunal Examinador conectados al directorio de 154 docentes de la Agenda), permitiendo alternar en cada campo al modo libre/manual si se requiere ingresar valores especiales.
* **Catálogo Global de Materias:** Las materias se gestionan en una lista global (`materiasGlobales: MateriaGlobal[]` con `{ nombre, anios, anio }`) en Configuración, permitiendo selección de un año, combinación de varios años (ej. 2º, 3º y 4º año) o todos los años (1º a 4º), con filtros por nivel y vinculación a cada Especialidad.
