# ECHO v2.6 — Sentient AI Companion & Native Windows Assistant

An advanced, atmospheric, emotionally-sentient AI companion interface featuring real-time **Vision & Facial Telemetry**, **Native Windows Desktop Automation**, **Ultra-Human Speech Synthesis**, an organic living fluid orb, ambient procedural music deck, live control center (weather, calendar, tasks), and proactive JARVIS intelligence.

---

## 🌟 What's New in v2.6

### 1. 👁️ Optical Vision & Facial Telemetry Matrix (`js/vision.js`)
- **Real-time Facial Scanning**: Instant webcam feed with futuristic HUD scan reticle and laser sweep.
- **Mood & Emotion Telemetry**: Detects facial cues, smile curvature, eye dynamics, and fatigue:
  - `happy`: Vibrant smile frequency and enthusiasm
  - `focused`: Concentrated, sharp posture
  - `tired`: Fatigue detection with proactive break advice
- **Zero-Dependency Offline Computer Vision**: Runs directly on HTML5 Canvas with chromatic YCbCr color model analysis without external heavy model downloads.
- **Interactive Voice Queries**:
  - *"How do I look?"*
  - *"Check my face / expression"*
  - *"Turn on camera"* / *"Close camera"*

### 2. 🖥️ Native Windows Desktop Assistant (`main.js` + `preload.js`)
- **Global Hotkey Trigger**: Press **`Alt + Space`** anywhere in Windows to summon or hide Echo instantly.
- **Frameless Glass Window**: Apple macOS/iOS style floating glassmorphism with subtle drop shadows.
- **System Window Controls**: Integrated Minimize, Maximize, and Close actions.
- **Quick Desktop Launch**:
  ```bash
  npm start
  ```

### 3. ⚙️ Real OS Automation Bridge (`js/osBridge.js`)
Echo can directly control Windows apps and hardware via secure IPC and PowerShell:
- **App Launcher**:
  - *"Open Visual Studio Code"* (or *"Open VS Code"*)
  - *"Open File Explorer"* (or *"Open files"*)
  - *"Launch Notepad"*
  - *"Open Calculator"*
  - *"Open Terminal"* (or *"Open PowerShell"*)
  - *"Launch Chrome"* / *"Open Spotify"*
- **Hardware & System Control**:
  - *"Take a screenshot"* (automatically saved to your Windows Pictures folder)
  - *"Set volume to 50"* / *"Mute volume"* / *"Unmute"*
  - *"System status"* (reports active RAM and CPU load)
  - *"Lock computer"* (instantly secures workstation)

### 4. 🎙️ Ultra-Human Voice Engine (`js/voice.js`)
- **Natural Conversational Cadence**: Splits sentences into micro-thought clauses with subtle 80ms human breathing pauses instead of continuous robotic monotone delivery.
- **Neural Voice Auto-Selection**: Automatically prioritizes modern neural system voices (Microsoft Jenny, Aria, Guy, Google US English).
- **Live Interim Hearing**: Displays words on-screen in real time as you speak them (`YOU (HEARING...)`).
- **Cinema-Grade ElevenLabs Integration**: Optional ElevenLabs streaming with automatic exponential backoff retry.
- **Bilingual & Hinglish Understanding**: Responds warmly to casual Hinglish greetings (*"kaisa hai"*, *"kya chal raha hai"*, *"kisne banaya"*).

---

## ⌨️ Complete Quick Controls & Shortcuts

| Action | Control |
| :--- | :--- |
| **Summon / Hide Echo (Desktop)** | **`Alt + Space`** or **`Ctrl + Shift + Space`** |
| **Speak to Echo** | Click **Mic** or press **Spacebar** |
| **Toggle Vision / Camera** | Click **Vision** in top bar or say *"Open camera"* |
| **Transmit Command** | Press **Enter** in command bar or click **Send** |
| **Toggle Control Center** | Click **Dashboard** in top bar |
| **Play/Pause Ambient Music** | Click Play on the bottom-left deck |
| **Inspect Stored Memories** | Click **Memory** in top bar |
| **Configure API Keys** | Click **Settings** in top bar |

---

## 🚀 How to Run

### Option A: Native Desktop App (Recommended for OS Automation & Hotkey)
```bash
cd C:\Users\aloks\.gemini\antigravity\scratch\Echo-1
npm start
```

### Option B: Instant In-Browser Experience (100% Offline)
Simply double click `index.html` or open it in any web browser (Chrome, Edge, Brave, etc.).
No installation or build tools required!
