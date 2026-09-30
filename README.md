# Panel IPA 2026

Plataforma de gestión e información para el Instituto de Profesores Artigas (IPA), desarrollada con Angular para el frontend y Node.js/Express con SQLite para el backend.

## Características Principales

*   **Dashboard de Exámenes:** Consulta y edición de fechas, horarios, tribunales y salones.
*   **Horarios y Agenda:** Visualización y actualización de horarios de clases y agenda docente.
*   **Inasistencias:** Registro y visualización de inasistencias docentes.
*   **Contactos y DOE:** Directorio de contactos institucionales y docentes.
*   **Gestión (CRUD):** El sistema permite la creación, lectura, actualización (PUT) y eliminación (DELETE) de registros directamente desde la interfaz.
*   **Scraping y Sincronización:** Scripts de extracción automática de datos desde orígenes oficiales.

## Estructura del Proyecto

*   **`src/`:** Código fuente de la aplicación Angular (Frontend).
*   **`backend/`:** Servidor Node.js con Express y base de datos SQLite (`database.sqlite`).
*   **`extract_*.js`:** Scripts de Node.js encargados de extraer (scrapear) información actualizada.
*   **`update_all_data.bat`:** Script por lotes que ejecuta todos los extractores de datos de manera secuencial y luego compila la aplicación web.
*   **`iniciar.bat`:** Script recomendado para levantar simultáneamente el servidor backend y el panel frontend.

## Requisitos Previos

*   Node.js (versión 18 o superior recomendada)
*   NPM (Node Package Manager)

## Instalación y Ejecución

1.  **Clonar el repositorio y ubicar la carpeta:**
    Asegúrate de estar en el directorio del proyecto.

2.  **Instalar las dependencias:**
    Tanto en la raíz del proyecto (para Angular y scripts de extracción) como en el backend:
    ```bash
    npm install
    cd backend
    npm install
    cd ..
    ```

3.  **Iniciar la aplicación:**
    Para levantar todo el entorno (servidor y cliente), simplemente ejecuta:
    ```cmd
    iniciar.bat
    ```
    Alternativamente, puedes levantar el backend y frontend por separado:
    *   Backend: `cd backend && node server.js` (Corre en http://localhost:3000)
    *   Frontend: `ng serve` (Corre en http://localhost:4200)

4.  **Actualizar Datos:**
    Si necesitas extraer y sincronizar los datos de scraping más recientes (y recompilar la app para producción), puedes ejecutar:
    ```cmd
    update_all_data.bat
    ```

## Endpoints del Backend

El backend expone una API REST con métodos `GET`, `POST`, `PUT` y `DELETE` para los siguientes recursos:
*   `/api/horarios`
*   `/api/contactos`
*   `/api/inasistencias`
*   `/api/examenes`
*   `/api/agenda`
*   `/api/configuracion`
