@echo off
cd /d "%~dp0"
echo Actualizando noticias y llamados...
npm run extract:news
if %ERRORLEVEL% NEQ 0 (
    echo Error al actualizar las noticias.
    pause
    exit /b %ERRORLEVEL%
)
echo Proceso completado exitosamente. (2026-03-26)
timeout /t 5
