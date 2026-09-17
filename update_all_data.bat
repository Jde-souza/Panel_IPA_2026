@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo   PANEL IPA 2026 - ACTUALIZACION DE DATOS
echo ==================================================
echo.
echo [1/4] Actualizando Noticias y Llamados...
node extract_news.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la extraccion de noticias.
    pause
    exit /b 1
)

echo.
echo [2/4] Actualizando Inasistencias Docentes...
node extract_inasistencias.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la extraccion de inasistencias.
    pause
    exit /b 2
)

echo.
echo [3/4] Actualizando Horarios...
node extract_horarios.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la extraccion de horarios.
    pause
    exit /b 3
)

echo.
echo [4/4] Actualizando Agenda Docente...
node extract_agenda.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la extraccion de la agenda.
    pause
    exit /b 4
)

echo.
echo [5/5] Compilando la aplicacion web (Angular)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la compilacion de Angular.
    pause
    exit /b 5
)

echo.
echo ==================================================
echo   Proceso completado exitosamente: %DATE% %TIME%
echo ==================================================
echo.
timeout /t 10
endlocal
