@echo off
echo ================================
echo   One Data - Frontend
echo   React / Vite on :5173
echo ================================

cd /d "%~dp0frontend"
echo.
echo Starting frontend... (http://localhost:5173)
echo Press CTRL+C to stop
echo.

npm run dev
pause
