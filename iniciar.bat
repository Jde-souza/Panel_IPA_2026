@echo off
title Lanzador del Sistema Panel IPA 2026
echo ==============================================
echo   Iniciando Panel IPA 2026 (Local)
echo ==============================================
echo.

echo [1/2] Iniciando el servidor Backend...
start "Backend Panel IPA" cmd /k "cd backend && npm run dev"

echo [2/2] Iniciando el servidor Frontend (Angular)...
start "Frontend Panel IPA" cmd /k "npm start"

echo.
echo ==============================================
echo Las aplicaciones se estan iniciando en nuevas ventanas de consola.
echo No cierres las consolas negras que acaban de abrirse.
echo ==============================================
echo.
pause
