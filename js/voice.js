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

        // 1. First priority: High-fidelity Online Neural voices (Windows 11 / Edge / Chrome)
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

        // 1. Cinema ElevenLabs Voice (If API key provided)
        if (this.elevenLabsKey) {
            try {
                await this.speakElevenLabsWithRetry(text, emotion, onEnd);
                return;
            } catch (e) {
                console.warn("ElevenLabs streaming error, engaging human neural browser voice:", e);
            }
        }

        // 2. Ultra-Smooth Human Cadence Browser Speech
        this.speakNaturalHuman(text, emotion, onEnd);
    }

    async speakElevenLabsWithRetry(text, emotion, onEnd, maxRetries = 2) {
        let attempt = 0;
        let lastError = null;

        while (attempt < maxRetries) {
            try {
                await this.speakElevenLabs(text, emotion, onEnd);
                return;
            } catch (err) {
                attempt++;
                lastError = err;
                await new Promise(r => setTimeout(r, 400 * attempt));
            }
        }
        throw lastError;
    }

    async speakElevenLabs(text, emotion, onEnd) {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}/stream`;

        let stability = 0.52;
        let similarity = 0.88;
        if (emotion === "happy") stability = 0.45;
        else if (emotion === "alert") stability = 0.68;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": this.elevenLabsKey
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: { stability, similarity_boost: similarity }
            })
        });

        if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);

        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudioEl = audio;

        if (this.audioContext) {
            try {
                const source = this.audioContext.createMediaElementSource(audio);
                source.connect(this.analyser);
                source.connect(this.audioContext.destination);
            } catch (e) {}
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

        audio.play();
    }

    // Expressive Human Cadence with Micro-Intonation & Natural Breathing
    speakNaturalHuman(fullText, emotion = "idle", onEnd = null) {
        if (!this.synth) return;

        // Split text into human thought clauses at punctuation
        const chunks = fullText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [fullText];
        const bestVoice = this.getBestNaturalVoice();

        let chunkIndex = 0;
        this.isSpeaking = true;
        if (this.onStateChangeCallback) this.onStateChangeCallback("speaking");

        const speakNextChunk = () => {
            if (chunkIndex >= chunks.length) {
                this.isSpeaking = false;
                if (onEnd) onEnd();
                if (this.onStateChangeCallback) this.onStateChangeCallback("idle");
                this.scheduleRestart();
                return;
            }

            const chunk = chunks[chunkIndex].trim();
            chunkIndex++;

            if (!chunk) {
                speakNextChunk();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunk);
            if (bestVoice) utterance.voice = bestVoice;

            // Human intonation & prosody
            const isQuestion = chunk.endsWith("?");
            if (emotion === "happy") {
                utterance.pitch = isQuestion ? 1.08 : 1.04;
                utterance.rate = 1.0;
            } else if (emotion === "alert") {
                utterance.pitch = 1.1;
                utterance.rate = 1.06;
            } else if (emotion === "thinking") {
                utterance.pitch = 0.98;
                utterance.rate = 0.95;
            } else {
                utterance.pitch = isQuestion ? 1.05 : 0.99;
                utterance.rate = 0.98; // Relaxed confident conversational cadence
            }

            utterance.onend = () => {
                // Natural 90ms human micro-pause between thought clauses
                setTimeout(speakNextChunk, 90);
            };

            utterance.onerror = () => {
                speakNextChunk();
            };

            this.synth.speak(utterance);
        };

        speakNextChunk();
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
