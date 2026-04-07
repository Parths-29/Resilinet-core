@echo off
echo ============================================
echo  ResiliNet Backend - Installing Dependencies
echo ============================================
cd /d d:\Ai_driven_res\AI-Driven-Financial-Contagion-Simulation-main\ml_core_\backend
pip install flask flask-cors pandas numpy networkx scikit-learn scipy
echo.
echo ============================================
echo  Starting Flask Server on port 5000...
echo ============================================
python server.py
pause
