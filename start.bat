@echo off
cd /d "%~dp0"
echo Starting API server...
start /b python server.py
timeout /t 2 /nobreak >nul
echo Starting Vite dev server...
start http://localhost:5174
npm run dev
