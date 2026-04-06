@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo   PANEL IPA 2026 - ACTUALIZACION DE DATOS
echo ==================================================
echo.
echo [1/3] Actualizando Noticias y Llamados...
node extract_news.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la extraccion de noticias.
    pause
    exit /b 1
)

echo.
echo [2/3] Actualizando Inasistencias Docentes...
node extract_inasistencias.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la extraccion de inasistencias.
    pause
    exit /b 2
)

echo.
echo [3/3] Actualizando Horarios...
node extract_horarios.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la extraccion de horarios.
    pause
    exit /b 3
)

echo.
echo ==================================================
echo   Proceso completado exitosamente: %DATE% %TIME%
echo ==================================================
echo.
timeout /t 10
endlocal
