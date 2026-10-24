@echo off
title Echo Sentient AI Assistant
cd /d "%~dp0"

echo ========================================================
echo   ECHO - Sentient AI Companion and Windows Assistant
echo   Summon anytime: Alt + Space
echo   Hands-free: Say "Hey Echo"
echo ========================================================
echo.

if not exist "node_modules\electron\dist\electron.exe" (
    echo [Echo] Setting up desktop engine...
    call npm install
    call node node_modules\electron\install.js
)

echo [Echo] Launching Echo Desktop Window...
start "" "node_modules\electron\dist\electron.exe" .

echo [Echo] Echo is active! Summon anytime using Alt+Space.
exit /b 0
