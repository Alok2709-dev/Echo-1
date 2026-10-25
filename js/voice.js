/* ==========================================================
   ECHO MASTER VOICE & SPEECH ENGINE (v3.1 Unified Architecture)
   - Unified Single-Stream Speech Recognition (Zero Hardware Conflicts)
   - Integrated "Hey Echo" Wake Word Detection + Command Capture
   - Human-Grade Neural Voice Selection (Microsoft Online Natural / Google)
   - Expressive Human Prosody, Breathing Pauses & Intonation
   - ElevenLabs Cinema Streaming Integration
========================================================== */

class EchoVoiceEngine {
    constructor() {
        this.synth = window.speechSynthesis;
        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.isWakeWordActive = localStorage.getItem("echo_wakeword_enabled") !== "false";
        
        // Mode: 'wakeword' (listening for "hey echo") or 'command' (capturing full sentence)
        this.listenMode = 'wakeword';

        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.micStream = null;
        this.audioLevel = 0;

        this.onTranscriptCallback = null;
        this.onInterimCallback = null;
        this.onStateChangeCallback = null;

        this.elevenLabsKey = localStorage.getItem("echo_elevenlabs_api_key") || "";
        this.elevenLabsVoiceId = localStorage.getItem("echo_elevenlabs_voice_id") || "21m00Tcm4TlvDq8ikWAM"; // Rachel
        this.alwaysListen = localStorage.getItem("echo_always_listen") === "true";

        this.currentAudioEl = null;
        this.cachedVoices = [];
        this.restartTimer = null;
        this.silenceTimer = null;

        this.wakePatterns = [
            /\bhey\s+echo\b/i,
            /\bok\s+echo\b/i,
            /\bhello\s+echo\b/i,
            /\bsun\s+echo\b/i,
            /\bsuno\b/i,
            /\becho\b/i
        ];

        this.initVoices();
        this.initAudioContext();
        this.initUnifiedSpeechRecognition();
        this.initNativeVoiceBridge();

        // Proactively start audio analysis stream on initial user gesture or timeout
        window.addEventListener("click", () => this.startMicStream(), { once: true });
        window.addEventListener("keydown", () => this.startMicStream(), { once: true });
    }

    initNativeVoiceBridge() {
        if (typeof window.electronAPI !== "undefined") {
            if (window.electronAPI.onNativeVoiceTranscript) {
                console.log("[EchoVoice] Attaching Windows Native Speech Ear Listener.");
                window.electronAPI.onNativeVoiceTranscript((data) => {
                    this.handleNativeSpeech(data);
                });
            }
            if (window.electronAPI.onVoiceStatus) {
                window.electronAPI.onVoiceStatus((status) => {
                    console.log("[EchoVoice] Native voice status:", status);
                    const indicator = document.getElementById("nativeVoiceIndicator");
                    if (indicator) {
                        indicator.classList.toggle("connected", status.active);
                        indicator.title = status.message || "Windows Speech Ear Active";
                    }
                });
            }
        }
    }

    handleNativeSpeech(data) {
        if (this.isSpeaking) return;
        const finalText = data.final ? data.final.trim() : "";
        const interimText = data.interim ? data.interim.trim() : "";
        const active = (finalText || interimText).trim();
        if (!active) return;

        // 1. ALWAYS-LISTEN MODE OR ACTIVE COMMAND MODE (Direct execution without needing 'Hey Echo')
        if (this.alwaysListen || this.listenMode === 'command') {
            if (this.onInterimCallback && active) {
                this.onInterimCallback(active);
            }
            if (finalText) {
                let cleaned = finalText;
                for (let pattern of this.wakePatterns) {
                    cleaned = cleaned.replace(pattern, "").trim();
                }
                this.dispatchCommand(cleaned || finalText);
            } else {
                clearTimeout(this.silenceTimer);
                this.silenceTimer = setTimeout(() => {
                    if (interimText) {
                        let cleaned = interimText;
                        for (let pattern of this.wakePatterns) {
                            cleaned = cleaned.replace(pattern, "").trim();
                        }
                        this.dispatchCommand(cleaned || interimText);
                    }
                }, 1400);
            }
            return;
        }

        // 2. WAKE WORD DETECTION (When Idle in background)
        for (let pattern of this.wakePatterns) {
            if (pattern.test(active)) {
                console.log(`[EchoVoice-Native] Wake word triggered: "${active}"`);
                this.listenMode = 'command';
                if (this.onStateChangeCallback) this.onStateChangeCallback('listening');
                if (window.echoSounds) window.echoSounds.playWakeChime();

                const remaining = active.replace(pattern, "").trim().replace(/^[,.]/, "").trim();
                if (remaining.length > 2) {
                    this.dispatchCommand(remaining);
                } else {
                    this.acknowledgeWake();
                }
                return;
            }
        }

    initVoices() {
        if (!this.synth) return;
        const load = () => {
            this.cachedVoices = this.synth.getVoices();
        };
        load();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = load;
        }
    }

    setElevenLabsKey(key, voiceId) {
        this.elevenLabsKey = key.trim();
        if (voiceId) this.elevenLabsVoiceId = voiceId.trim();
        localStorage.setItem("echo_elevenlabs_api_key", this.elevenLabsKey);
        localStorage.setItem("echo_elevenlabs_voice_id", this.elevenLabsVoiceId);
    }

    initAudioContext() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioContext = new AudioCtx();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 64;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            }
        } catch (e) {
            console.warn("AudioContext not supported or blocked:", e);
        }
    }

    async startMicStream() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
        try {
            if (this.audioContext && this.audioContext.state === "suspended") {
                await this.audioContext.resume();
            }
            if (!this.micStream) {
                this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                const source = this.audioContext.createMediaStreamSource(this.micStream);
                source.connect(this.analyser);
            }
        } catch (e) {
            console.warn("Could not attach mic to Web Audio analyzer:", e);
        }
    }

    stopMicStream() {
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
    }

    // Unified Master Single-Stream Pipeline
    initUnifiedSpeechRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn("[EchoVoice] Web Speech API not supported.");
            return;
        }

        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";

        let currentSentence = "";

        this.recognition.onstart = () => {
            this.isListening = true;
            this.startMicStream();
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback(this.listenMode === 'command' ? 'listening' : 'idle');
            }
        };

        this.recognition.onresult = (event) => {
            // Do not listen to own synthesized voice speaking
            if (this.isSpeaking) return;

            let interimStr = "";
            let finalStr = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalStr += text;
                } else {
                    interimStr += text;
                }
            }

            const activeTranscript = (finalStr || interimStr).trim();
            if (!activeTranscript) return;

            // 1. ALWAYS-LISTEN MODE OR COMMAND CAPTURE PHASE
            if (this.alwaysListen || this.listenMode === 'command') {
                if (this.onInterimCallback && activeTranscript) {
                    this.onInterimCallback(activeTranscript);
                }

                if (finalStr) {
                    let cleaned = finalStr.trim();
                    for (let pattern of this.wakePatterns) {
                        cleaned = cleaned.replace(pattern, "").trim();
                    }
                    this.dispatchCommand(cleaned || finalStr.trim());
                } else {
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        if (interimStr.trim()) {
                            let cleaned = interimStr.trim();
                            for (let pattern of this.wakePatterns) {
                                cleaned = cleaned.replace(pattern, "").trim();
                            }
                            this.dispatchCommand(cleaned || interimStr.trim());
                        }
                    }, 1400);
                }
                return;
            }

            // 2. WAKE-WORD DETECTION PHASE (When Idle in background)
            for (let pattern of this.wakePatterns) {
                if (pattern.test(activeTranscript)) {
                    console.log(`[EchoVoice] Wake word detected: "${activeTranscript}"`);
                    
                    this.listenMode = 'command';
                    if (this.onStateChangeCallback) this.onStateChangeCallback('listening');
                    if (window.echoSounds) window.echoSounds.playWakeChime();

                    const remaining = activeTranscript.replace(pattern, "").trim().replace(/^[,.]/, "").trim();
                    if (remaining.length > 2) {
                        this.dispatchCommand(remaining);
                    } else {
                        this.acknowledgeWake();
                    }
                    return;
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.warn("[EchoVoice] Speech recognition error:", event.error);
            // If in browser mode and network error occurs, show polite hint
            if (event.error === "network" && !(typeof window.electronAPI !== "undefined" && window.electronAPI.isElectron)) {
                const dialogueText = document.getElementById("dialogueText");
                if (dialogueText) {
                    dialogueText.textContent = "Connecting to speech services... Tap mic or type below.";
                }
            }
            if (event.error !== "not-allowed" && event.error !== "aborted") {
                this.scheduleRestart();
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            // Always automatically reconnect so mic is NEVER dead
            this.scheduleRestart();
        };

        // Start master listening after brief delay
        setTimeout(() => this.startMasterRecognition(), 1000);
    }

    startMasterRecognition() {
        if (!this.recognition || this.isListening) return;
        try {
            this.recognition.start();
        } catch (e) {
            this.scheduleRestart();
        }
    }

    scheduleRestart() {
        clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
            if (!this.isListening && !this.isSpeaking) {
                this.startMasterRecognition();
            }
        }, 800);
    }

    // Trigger command mode directly (e.g. mic button or spacebar)
    toggleListening() {
        this.startMicStream();
        if (this.listenMode === 'command') {
            this.listenMode = 'wakeword';
            if (this.onStateChangeCallback) this.onStateChangeCallback('idle');
            return false;
        } else {
            this.stopSpeaking();
            this.listenMode = 'command';
            if (this.onStateChangeCallback) this.onStateChangeCallback('listening');
            if (window.echoSounds) window.echoSounds.playListenTick();
            return true;
        }
    }

    acknowledgeWake() {
        const userName = window.echoMemory ? window.echoMemory.getUserName() : "Alok";
        const replies = [
            `Yes, ${userName}? I'm listening.`,
            `Online, ${userName}. What's on your mind?`,
            `I'm here, ${userName}. Tell me what to do.`
        ];
        const chosen = replies[Math.floor(Math.random() * replies.length)];
        
        const dialogueSpeaker = document.getElementById("dialogueSpeaker");
        const dialogueText = document.getElementById("dialogueText");
        if (dialogueSpeaker) dialogueSpeaker.textContent = "ECHO";
        if (dialogueText) dialogueText.textContent = chosen;

        this.speak(chosen, "happy", () => {
            // Keep command mode active for follow-up instruction
            this.listenMode = 'command';
            if (this.onStateChangeCallback) this.onStateChangeCallback('listening');
        });
    }

    dispatchCommand(text) {
        clearTimeout(this.silenceTimer);
        this.listenMode = 'wakeword'; // Reset to background wake word mode
        if (this.onStateChangeCallback) this.onStateChangeCallback('idle');

        if (this.onTranscriptCallback) {
            this.onTranscriptCallback(text);
        }
    }

    stopSpeaking() {
        if (this.synth) this.synth.cancel();
        if (this.currentAudioEl) {
            this.currentAudioEl.pause();
            this.currentAudioEl = null;
        }
        this.isSpeaking = false;
        if (this.onStateChangeCallback) this.onStateChangeCallback('idle');
    }

    // Select the most natural human-sounding voice available on the machine
    getBestNaturalVoice() {
        const voices = this.cachedVoices.length > 0 ? this.cachedVoices : (this.synth ? this.synth.getVoices() : []);
        if (!voices || voices.length === 0) return null;

        // 0. User's explicitly chosen voice preference
        const pref = localStorage.getItem("echo_system_voice");
        if (pref && pref !== "auto") {
            const chosen = voices.find(v => v.name.toLowerCase().includes(pref.toLowerCase()));
            if (chosen) return chosen;
        }

        // 1. High-fidelity Online Neural voices (Windows 11 / Edge / Chrome)
        const topNeural = [
            "Microsoft Jenny Online (Natural) - English (United States)",
            "Microsoft Aria Online (Natural) - English (United States)",
            "Microsoft Guy Online (Natural) - English (United States)",
            "Microsoft Sonia Online (Natural) - English (United Kingdom)",
            "Microsoft Ryan Online (Natural)",
            "Google US English",
            "Google UK English Female"
        ];

        for (const name of topNeural) {
            const found = voices.find(v => v.name.includes(name));
            if (found) return found;
        }

        // 2. Second priority: Any voice labeled "Natural" or "Neural"
        const naturalVoice = voices.find(v => (v.name.includes("Natural") || v.name.includes("Neural")) && v.lang.startsWith("en"));
        if (naturalVoice) return naturalVoice;

        // 3. Third priority: Best available English female/male
        const englishVoices = voices.filter(v => v.lang.startsWith("en"));
        const humanNames = ["Jenny", "Aria", "Samantha", "Victoria", "Karen", "Daniel", "Guy", "Zira"];
        for (const h of humanNames) {
            const found = englishVoices.find(v => v.name.includes(h));
            if (found) return found;
        }

        return englishVoices[0] || voices[0];
    }

    async speak(text, emotion = "idle", onEnd = null) {
        this.stopSpeaking();
        if (!text || !text.trim()) return;

        // 1. Cinema ElevenLabs High-Fidelity Voice (If Key Configured)
        const cleanKey = (this.elevenLabsKey || "").trim().replace(/^["']|["']$/g, '');
        if (cleanKey && cleanKey.length > 12) {
            try {
                await this.speakElevenLabs(text, emotion, onEnd);
                return;
            } catch (e) {
                console.warn("[EchoVoice] ElevenLabs streaming failed, switching to Natural Human System Voice:", e);
                this.isSpeaking = false;
            }
        }

        // 2. High-Performance Natural Human Voice (Zero-Lag Built-in Speech)
        this.speakNaturalHuman(text, emotion, onEnd);
    }

    async testElevenLabs(key, voiceId) {
        const testKey = (key || this.elevenLabsKey || "").trim().replace(/^["']|["']$/g, '');
        const testVoice = voiceId || this.elevenLabsVoiceId || "21m00Tcm4TlvDq8ikWAM";
        if (!testKey) throw new Error("Please enter your ElevenLabs API Key.");

        const oldKey = this.elevenLabsKey;
        const oldVoice = this.elevenLabsVoiceId;
        this.elevenLabsKey = testKey;
        this.elevenLabsVoiceId = testVoice;

        try {
            await this.speakElevenLabs("Hello Alok. Cinema neural voice synthesizer is active.", "happy");
            return { success: true, message: "Connected! Playing ElevenLabs high-fidelity audio." };
        } catch (e) {
            this.elevenLabsKey = oldKey;
            this.elevenLabsVoiceId = oldVoice;
            throw e;
        }
    }

    async speakElevenLabs(text, emotion, onEnd) {
        const cleanKey = (this.elevenLabsKey || "").trim().replace(/^["']|["']$/g, '');
        const voiceId = this.elevenLabsVoiceId || "21m00Tcm4TlvDq8ikWAM";
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

        const cleanText = text
            .replace(/\[(idle|happy|thinking|alert|speaking)\]/gi, "")
            .replace(/[*_#`~>]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        let stability = 0.50;
        let similarity = 0.85;
        if (emotion === "happy") stability = 0.42;
        else if (emotion === "alert") stability = 0.65;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": cleanKey
            },
            body: JSON.stringify({
                text: cleanText,
                model_id: "eleven_turbo_v2_5",
                voice_settings: { stability, similarity_boost: similarity }
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            const msg = errData?.detail?.message || errData?.message || `HTTP ${res.status}`;
            throw new Error(`ElevenLabs error: ${msg}`);
        }

        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudioEl = audio;

        if (this.audioContext && this.audioContext.state === "suspended") {
            try { await this.audioContext.resume(); } catch (e) {}
        }

        this.isSpeaking = true;
        if (this.onStateChangeCallback) this.onStateChangeCallback("speaking");

        audio.onended = () => {
            this.isSpeaking = false;
            URL.revokeObjectURL(audioUrl);
            if (onEnd) onEnd();
            if (this.onStateChangeCallback) this.onStateChangeCallback("idle");
            this.scheduleRestart();
        };

        audio.onerror = () => {
            this.isSpeaking = false;
            URL.revokeObjectURL(audioUrl);
            if (onEnd) onEnd();
            if (this.onStateChangeCallback) this.onStateChangeCallback("idle");
        };

        await audio.play();
    }

    // Expressive Human Cadence with Micro-Intonation & Natural Breathing
    speakNaturalHuman(fullText, emotion = "idle", onEnd = null) {
        if (!this.synth) {
            if (onEnd) onEnd();
            return;
        }

        // Clean out emotion tags [happy], markdown asterisks, hashes
        const cleanText = fullText
            .replace(/\[(idle|happy|thinking|alert|speaking)\]/gi, "")
            .replace(/[*_#`~>]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (!cleanText) {
            if (onEnd) onEnd();
            return;
        }

        // Fix Chromium frozen synthesizer bug
        try {
            if (this.synth.paused) this.synth.resume();
            this.synth.cancel();
        } catch (e) {}

        const bestVoice = this.getBestNaturalVoice();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (bestVoice) utterance.voice = bestVoice;

        // Expressive prosody
        if (emotion === "happy") {
            utterance.pitch = 1.05;
            utterance.rate = 1.02;
        } else if (emotion === "alert") {
            utterance.pitch = 1.08;
            utterance.rate = 1.06;
        } else if (emotion === "thinking") {
            utterance.pitch = 0.98;
            utterance.rate = 0.96;
        } else {
            utterance.pitch = 1.01;
            utterance.rate = 1.0;
        }

        this.isSpeaking = true;
        if (this.onStateChangeCallback) this.onStateChangeCallback("speaking");
        this.activeUtterance = utterance; // Prevent garbage collection in Chromium

        utterance.onend = () => {
            this.isSpeaking = false;
            this.activeUtterance = null;
            if (onEnd) onEnd();
            if (this.onStateChangeCallback) this.onStateChangeCallback("idle");
            this.scheduleRestart();
        };

        utterance.onerror = (e) => {
            console.warn("[EchoVoice] Synth error:", e);
            this.isSpeaking = false;
            this.activeUtterance = null;
            if (onEnd) onEnd();
            if (this.onStateChangeCallback) this.onStateChangeCallback("idle");
        };

        this.synth.speak(utterance);
    }

    getAudioLevel() {
        if (this.analyser && (this.isListening || this.isSpeaking)) {
            this.analyser.getByteFrequencyData(this.dataArray);
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            this.audioLevel = sum / (this.dataArray.length * 255);
            return this.audioLevel;
        }

        if (this.isSpeaking) {
            return 0.38 + Math.sin(Date.now() * 0.012) * 0.22 + Math.cos(Date.now() * 0.024) * 0.1;
        }

        return 0;
    }
}

window.echoVoice = new EchoVoiceEngine();
