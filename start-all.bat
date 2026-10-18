@echo off
title SkillSwap - Launcher
color 0b
echo ========================================================
echo    SkillSwap - Peer-to-Peer Collaborative Platform
echo    Developed by Sanjeeviraj
echo ========================================================
echo.

echo [1/3] Starting Python Hybrid Recommendation Microservice on port 8000...
start "SkillSwap Recommendation Engine (Port 8000)" cmd /k "cd recommendation-service && python main.py"

echo [2/3] Starting Express.js Backend Server on port 5000...
start "SkillSwap REST Backend (Port 5000)" cmd /k "cd backend && node server.js"

timeout /t 3 /nobreak >nul

echo [3/3] Opening SkillSwap Web Application in your default browser...
start http://localhost:5000/index.html

echo.
echo All services have been launched!
echo - Web Platform: http://localhost:5000
echo - Recommendation API Docs: http://localhost:8000/docs
echo.
pause
