@echo off
cd /d "%~dp0"
echo Starting Proxy Server...
start "Proxy Server" cmd /k "node proxy-server.js || echo Proxy Server Failed & pause"
echo Starting Frontend...
start "Frontend App" cmd /k "npm.cmd run dev || echo Frontend Failed & pause"
echo Done! Two windows should have opened.
pause
