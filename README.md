# ECHO v3.0 — The Ultimate Sentient AI Companion & Windows Desktop Assistant

Echo is an Apple Intelligence & JARVIS-inspired, deeply sentient AI companion engineered to live permanently on your Windows PC. Featuring **Hands-Free "Hey Echo" Wake Word detection**, **Apple Dynamic Island Floating Pill**, **Multi-Modal Screen Perception**, **Local Ollama LLM integration**, and **Real Windows OS Automation**.

---

## 🌟 What's New in v3.0

### 1. 🎙️ Hands-Free "Hey Echo" Acoustic Wake Word (`js/wakeword.js`)
- **Zero-Click Voice Activation**: Echo listens in the background. Just say:
  - *"Hey Echo, open Spotify"*
  - *"Echo, what's on my calendar?"*
  - *"Sun Echo, kaisa hai?"*
- Instantly wakes with an iridescent aurora glow and audio-reactive orb pulse without touching your keyboard or mouse.

### 2. 🏝️ Apple Dynamic Island Floating Pill (`#dynamicIslandBar`)
- **Compact Desktop Dock**: Switch into Dynamic Island mode to dock Echo as a sleek floating glass capsule at the top of your screen.
- **Always-on-Top Perception**: Floats cleanly over games, code editors, and browsers with live audio waves, rotating mini-orb, and quick summon controls.
- Expand back to full holographic workspace anytime via the expand button or voice (*"Expand window"*).

### 3. 🖥️ Multi-Modal Screen Vision Perception (`js/screenVision.js`)
- Echo can inspect your desktop workspace and active windows:
  - *"Echo, see my screen"*
  - *"What is on my screen?"*
  - *"Analyze this code on my screen"*
- Captures the active monitor frame and provides immediate contextual understanding.

### 4. 🦙 Deep Local Brain — Ollama & Llama 3 Integration (`js/ollama.js`)
- **100% Offline, Private & Free Unlimited Reasoning**: Automatically connects to local Ollama (`http://localhost:11434`) running Llama 3, Mistral, Gemma, or Phi-3.
- Answers any programming, math, creative writing, or general knowledge question with zero cloud dependencies or subscriptions.
- Seamless fallback to Gemini Flash if cloud API is preferred.

### 5. ⚙️ Apple macOS / iOS 18 Glassmorphism Settings Center
- Completely redesigned with segmented categories:
  - 🧠 **Brain & LLM**: Local Ollama model selector & Gemini key configuration
  - 🎙️ **Wake Word & Voice**: Hands-free toggle & ElevenLabs cinema voice selection
  - 🖥️ **Windows Desktop**: Launch on Windows startup toggle & Alt+Space hotkey
  - 🔗 **Connected Services**: Real Google Calendar iCal sync & Spotify playlist URI
  - 👤 **Identity**: Name and personalized knowledge profile

### 6. 🪟 Permanent Windows Background Service (`main.js`)
- Runs continuously in the Windows System Tray even when the window is closed.
- Auto-starts on Windows login so Echo is always ready the moment you turn on your PC.
- Summon instantly from anywhere with **`Alt + Space`** or simply by saying **`"Hey Echo"`**.

---

## ⌨️ Global Shortcuts & Voice Commands

| Action | Control / Voice Command |
| :--- | :--- |
| **Summon / Hide Anywhere** | **`Alt + Space`** or **`Ctrl + Shift + Space`** |
| **Hands-Free Activation** | Say **`"Hey Echo"`** or **`"Echo"`** |
| **Screen Perception** | Say *"What is on my screen?"* or click **Screen** |
| **Toggle Dynamic Island** | Say *"Pill mode"* or click **Pill** in header |
| **Play Spotify / Apple Music** | *"Play Arijit Singh on Spotify"*, *"Play Apple Music"* |
| **Sync Google Calendar** | *"Sync calendar"*, *"What is my schedule today?"* |
| **Vision & Facial Mood** | *"How do I look?"*, *"Check my face"* |
| **Windows OS Control** | *"Open VS Code"*, *"Take screenshot"*, *"Set volume to 50"* |

---

## 🚀 How to Run Permanently on PC

Double-click **`run-echo.bat`** or run:
```powershell
cd C:\Users\aloks\.gemini\antigravity\scratch\Echo-1
npm start
```

Turn on **"Launch on Windows Startup"** inside Echo's Settings to keep Echo running as your daily permanent AI assistant.
