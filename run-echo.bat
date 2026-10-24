@echo off
title Echo - Sentient AI Companion
cd /d "%~dp0"

echo =======================================================
echo   ECHO - Sentient AI Companion & Windows Assistant
echo   Summon anytime: Alt + Space
echo   Hands-free: Say "Hey Echo"
echo =======================================================

if not exist "node_modules\electron" (
    echo [Echo] Installing core desktop dependencies (one-time setup)...
    call npm install
)

echo [Echo] Launching Echo Desktop Engine...
call npm start
pause
