# ECHO — Sentient AI Companion

An advanced, atmospheric, emotionally-sentient AI companion interface featuring a real-time reactive holographic core, voice recognition, speech synthesis, persistent personal memory, and dynamic emotion states.

---

## 🌟 Key Features

### 1. Dynamic Reactive Holographic Core
- **Multi-Ring Sci-Fi HUD**: Built with 2D Canvas and Three.js 3D ethereal wireframe particle clouds.
- **Emotion Color Shifting**: Smoothly transitions between emotional states:
  - 💠 **Idle**: Calm Cyber Cyan (`#00e5ff`)
  - 🌊 **Listening**: Electric Teal (`#00ffcc`)
  - 🔮 **Thinking**: Neural Violet (`#b388ff`)
  - ⚡ **Speaking**: Warm Golden Amber (`#ffab40`)
  - 🌿 **Happy / Joy**: Neon Emerald (`#00e676`)
  - 🚨 **Alert / Warning**: Crimson Warning (`#ff3d00`)
- **Audio Frequency Reactivity**: The core's rings and central orb physically pulse and expand to the exact audio waveform of your voice and Echo's synthetic speech via the Web Audio API.

### 2. Voice & Speech Synthesis Engine
- **Voice Hearing (STT)**: Click the glowing mic button or hold/press **Spacebar** to speak.
- **Voice Speech (TTS)**: Echo speaks back using tuned natural speech synthesis with emotion-based pitch modulation.
- **Live HUD Subtitles**: Real-time typewriter effect dialogue box with speaker identification.

### 3. Personal Knowledge & Memory Matrix
- **Persistent User Profile**: Remembers your name, preferences, traits, and interactions.
- **Fact Retention**: Say *"Remember that I love sci-fi"* or *"Remember that my project deadline is Friday"*, and Echo permanently stores it into its neural memory bank.
- **Memory Inspection HUD**: Click the **Memory** button in the top HUD to view, manage, or delete stored memories.

### 4. Smart Productivity & Local Intelligence
- **Scheduled Timers & Alerts**: *"Remind me to drink water in 5 minutes"* — Echo sets an internal timer and triggers a speech/visual alert when due.
- **Math & Computations**: *"Calculate 25 * 14"*, *"What is 1500 / 3?"*
- **Time & Date Awareness**: *"What time is it?"*, *"What day is today?"*
- **Quick Web Links**: *"Search quantum computing"*, *"Open YouTube"*, *"Open GitHub"*.
- **Optional Gemini API Key**: Click **Settings** in the HUD to enter an optional Google Gemini API key for unlimited multi-turn deep reasoning!

---

## 🚀 How to Run Locally

You don't need any complex build tools. Echo runs directly in any modern web browser:

1. **Option 1 (Direct)**: Double-click `index.html` or drag it into Google Chrome, Microsoft Edge, or Brave.
2. **Option 2 (Live Server)**:
   ```bash
   # Using Python:
   python -m http.server 8080

   # Or using VS Code / Antigravity Live Server extension.
   ```
   Then open `http://localhost:8080` in your browser.

---

## ⌨️ Controls & Shortcuts

| Action | Control |
| :--- | :--- |
| **Speak to Echo** | Click the **Mic** button or press **Spacebar** |
| **Transmit Command** | Press **Enter** in the command bar or click **Send** |
| **Skip Boot Animation** | Click anywhere during the initial loading screen |
| **Inspect Stored Memories** | Click **Memory** in the top navigation bar |
| **Configure Gemini Key** | Click **Settings** in the top navigation bar |
| **Manual Emotion Test** | Click the emotion pills on the right side of the screen |
