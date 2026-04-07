@echo off
echo ============================================
echo  ResiliNet Frontend - Installing Dependencies
echo ============================================
cd /d d:\Ai_driven_res\AI-Driven-Financial-Contagion-Simulation-main\ml_core_\frontend\FRONTEND
call npm install
echo.
echo ============================================
echo  Starting Vite Dev Server on port 5173...
echo ============================================
call npm run dev
pause
