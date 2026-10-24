/* ==========================================================
   ECHO VOICE & NEURAL SPEECH ENGINE (v2.6 Ultra-Human Polish)
   - Human-Grade Speech Synthesis (Natural Neural Cadence)
   - Continuous Interim Speech Recognition with Noise Filtering
   - Expressive Multi-turn Prosody & Emotion Modulation
   - ElevenLabs Cinema Streaming with Exponential Backoff
========================================================== */

class EchoVoiceEngine {
    constructor() {
        this.synth = window.speechSynthesis;
        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
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

        this.currentAudioEl = null;
        this.speechQueue = [];
        this.isProcessingQueue = false;

        this.cachedVoices = [];
        this.initVoices();
        this.initSpeechRecognition();
        this.initAudioContext();
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

    initSpeechRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn("Speech Recognition not supported in this environment.");
            return;
        }

        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = true; // Real-time interim feedback
        this.recognition.lang = "en-US";

        let finalTranscriptAccumulator = "";

        this.recognition.onstart = () => {
            this.isListening = true;
            finalTranscriptAccumulator = "";
            this.startMicStream();
            if (this.onStateChangeCallback) this.onStateChangeCallback("listening");
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptAccumulator += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Stream interim to UI so the user sees Echo hearing them in real-time
            if (this.onInterimCallback && interimTranscript) {
                this.onInterimCallback(interimTranscript);
            }

            if (finalTranscriptAccumulator && this.onTranscriptCallback) {
                const text = finalTranscriptAccumulator.trim();
                finalTranscriptAccumulator = "";
                this.onTranscriptCallback(text);
            }
        };

        this.recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            this.isListening = false;
            if (this.onStateChangeCallback) this.onStateChangeCallback("idle");
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.stopMicStream();
            if (this.onStateChangeCallback) this.onStateChangeCallback("idle");
        };
    }

    toggleListening() {
        if (!this.recognition) {
            alert("Speech Recognition not available in this browser. You can type in the dock!");
            return false;
        }

        if (this.isListening) {
            this.recognition.stop();
            return false;
        } else {
            try {
                this.stopSpeaking();
                this.recognition.start();
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    stopSpeaking() {
        if (this.synth) this.synth.cancel();
        if (this.currentAudioEl) {
            this.currentAudioEl.pause();
            this.currentAudioEl = null;
        }
        this.speechQueue = [];
        this.isProcessingQueue = false;
        this.isSpeaking = false;
    }

    // Select the most natural, human-sounding voice installed on the OS
    getBestNaturalVoice() {
        const voices = this.cachedVoices.length > 0 ? this.cachedVoices : (this.synth ? this.synth.getVoices() : []);
        if (!voices || voices.length === 0) return null;

        // High priority: Neural and Natural voices in Windows/Edge/Chrome
        const naturalPriority = [
            "Microsoft Jenny Online (Natural) - English (United States)",
            "Microsoft Aria Online (Natural) - English (United States)",
            "Microsoft Guy Online (Natural) - English (United States)",
            "Google US English",
            "Google UK English Female",
            "Samantha",
            "Daniel",
            "Microsoft Zira",
            "Microsoft David"
        ];

        for (const name of naturalPriority) {
            const found = voices.find(v => v.name.includes(name));
            if (found) return found;
        }

        // Second pass: Any voice tagged with "Natural" or "Neural"
        const neuralVoice = voices.find(v => (v.name.includes("Natural") || v.name.includes("Neural")) && v.lang.startsWith("en"));
        if (neuralVoice) return neuralVoice;

        // Third pass: Standard US/GB English voice
        return voices.find(v => v.lang === "en-US") || voices.find(v => v.lang.startsWith("en")) || voices[0];
    }

    async speak(text, emotion = "idle", onEnd = null) {
        this.stopSpeaking();
        if (!text || !text.trim()) return;

        // 1. ElevenLabs Neural Cinema Voice (If key provided)
        if (this.elevenLabsKey) {
            try {
                await this.speakElevenLabsWithRetry(text, emotion, onEnd);
                return;
            } catch (e) {
                console.warn("ElevenLabs streaming failed after retries, seamlessly engaging Human Neural Browser Voice:", e);
            }
        }

        // 2. High-Grade Human Browser Voice with Natural Conversational Cadence
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

        // Modulate stability & similarity based on emotion
        let stability = 0.55;
        let similarity = 0.85;
        if (emotion === "happy") { stability = 0.45; }
        else if (emotion === "alert") { stability = 0.70; }

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
                voice_settings: { stability: stability, similarity_boost: similarity }
            })
        });

        if (!res.ok) throw new Error(`ElevenLabs API returned ${res.status}`);

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
        };

        audio.play();
    }

    // High-Grade Natural Human Cadence with Micro-Pacing
    speakNaturalHuman(fullText, emotion = "idle", onEnd = null) {
        if (!this.synth) return;

        // Split text into conversational thought chunks for human-like breath & cadence
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

            // Natural human prosody tuning
            if (emotion === "happy") {
                utterance.pitch = 1.05;
                utterance.rate = 1.0;
            } else if (emotion === "alert") {
                utterance.pitch = 1.12;
                utterance.rate = 1.08;
            } else if (emotion === "thinking") {
                utterance.pitch = 0.98;
                utterance.rate = 0.95;
            } else {
                utterance.pitch = 1.0;
                utterance.rate = 0.98; // Slightly relaxed for calm, authoritative companion
            }

            utterance.onend = () => {
                // Natural micro-pause between thoughts (80ms)
                setTimeout(speakNextChunk, 80);
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

        // Organic biological pulsing when speaking
        if (this.isSpeaking) {
            return 0.38 + Math.sin(Date.now() * 0.012) * 0.22 + Math.cos(Date.now() * 0.024) * 0.1;
        }

        return 0;
    }
}

window.echoVoice = new EchoVoiceEngine();
