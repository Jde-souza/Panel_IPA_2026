# Guía Maestra para Agentes de IA — Panel IPA 2026

Este directorio (`ai-context/`) contiene toda la documentación técnica, reglas de negocio, esquemas de datos y convenciones de código del proyecto **Panel IPA 2026** (Instituto de Profesores Artigas - CFE / ANEP, Uruguay). Está diseñado específicamente para que agentes de IA puedan entender y modificar el sistema con precisión sin necesidad de explorar todo el repositorio desde cero.

---

## 📚 Índice de Documentación en `ai-context/`

1. **[`01-ARCHITECTURE-AND-STACK.md`](./01-ARCHITECTURE-AND-STACK.md)**
   * Stack tecnológico (Angular 21, Tailwind 3, Express 5, SQLite3).
   * Mapa completo de directorios y archivos.
   * Flujo de datos híbrido (API REST SQLite vs. JSON estáticos en `public/data/`).
2. **[`02-BACKEND-AND-DATABASE.md`](./02-BACKEND-AND-DATABASE.md)**
   * Esquema exacto de las 6 tablas SQLite (`horarios`, `contactos`, `inasistencias`, `examenes`, `agenda`, `configuracion`).
   * Contratos de todos los endpoints REST en `http://localhost:3000/api`.
   * Transformaciones de datos críticas entre Frontend y Backend (campos JSON serializados, columnas desnormalizadas).
3. **[`03-FRONTEND-COMPONENTS-AND-SERVICES.md`](./03-FRONTEND-COMPONENTS-AND-SERVICES.md)**
   * Arquitectura de componentes Angular Standalone, rutas y estado.
   * Servicios globales (`DataService`, `AlertService`, `AccessibilityService`, `ThemeService`).
   * Sistema de diseño institucional ANEP, variables CSS, Modo Oscuro y accesibilidad (ARIA Live).
4. **[`04-SCRAPERS-AND-AUTOMATION.md`](./04-SCRAPERS-AND-AUTOMATION.md)**
   * Funcionamiento de los scripts `extract_*.js` (Google Sheets, portales ANEP/CFE).
   * Automatización local (`iniciar.bat`, `update_all_data.bat`) y CI/CD (`.github/workflows/`).

---

## ⚡ Comandos Rápidos de Desarrollo

| Acción | Comando | Notas |
| :--- | :--- | :--- |
| **Iniciar Frontend (Dev)** | `npm start` (o `ng serve`) | Corre en `http://localhost:4200` |
| **Iniciar Backend (Dev)** | `cd backend && npm run dev` | Corre en `http://localhost:3000` |
| **Iniciar Todo (Windows)** | `.\iniciar.bat` | Abre dos consolas (Backend + Frontend) |
| **Compilar Frontend** | `npm run build` | Genera bundle en `dist/` |
| **Poblar BD desde JSONs** | `cd backend && node seed.js` | Importa `public/data/*.json` a `database.sqlite` |
| **Actualizar Scrapers** | `npm run update:all` | Ejecuta todos los `extract_*.js` y luego `npm run build` |

---

## 🛡️ Reglas de Oro para Agentes de IA

1. **Idioma:** Toda la interfaz de usuario (UI), mensajes de alerta (`AlertService`), anuncios de accesibilidad (`AccessibilityService`) y nombres de campos de dominio deben estar en **español (Uruguay)**.
2. **Componentes Standalone:** El proyecto utiliza Angular 21 con componentes `standalone: true` e inyección mediante `inject()`. No crear `NgModules`.
3. **Notificaciones UI y Confirmaciones:** Nunca usar `alert()` ni `confirm()` nativos del navegador; utilizar siempre `AlertService` (`success`, `error`, `warning`, `info`) para alertas Toast y `await alertService.confirm(...)` para modales de confirmación/eliminación.
4. **Accesibilidad (a11y):** Mantener soporte de teclado (`Escape` para cerrar modales), atributos `aria-*` y anuncios mediante `AccessibilityService.announce()`.
5. **Consistencia Visual y Modo Oscuro:** Respetar las variables CSS definidas en `src/styles.css` (`--anep-blue`, `--anep-cyan`, `--anep-yellow`, `--surface`, `--card-bg`) y las clases `dark:` de Tailwind para no romper el modo oscuro.
6. **Sincronización con Configuración Global:** Los formularios de Horarios, Inasistencias y Exámenes consumen listas dinámicas desde `/api/configuracion` (especialidades, materias globales, salones por piso, planes y causales). Al modificar formularios, verificar que sigan integrados con `getConfiguracion()`.
