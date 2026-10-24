/* ==========================================================
   ECHO VOICE & NEURAL SPEECH ENGINE
   Browser Web Speech + Optional ElevenLabs High-Fidelity Audio
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
        this.onStateChangeCallback = null;

        this.elevenLabsKey = localStorage.getItem("echo_elevenlabs_api_key") || "";
        this.elevenLabsVoiceId = localStorage.getItem("echo_elevenlabs_voice_id") || "21m00Tcm4TlvDq8ikWAM"; // Default Rachel

        this.currentAudioEl = null;

        this.initSpeechRecognition();
        this.initAudioContext();
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
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }

        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = "en-US";

        this.recognition.onstart = () => {
            this.isListening = true;
            this.startMicStream();
            if (this.onStateChangeCallback) this.onStateChangeCallback("listening");
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (this.onTranscriptCallback) {
                this.onTranscriptCallback(transcript);
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
        this.isSpeaking = false;
    }

    async speak(text, emotion = "idle", onEnd = null) {
        this.stopSpeaking();

        // 1. If ElevenLabs API Key is present, use neural cloud voice
        if (this.elevenLabsKey) {
            try {
                await this.speakElevenLabs(text, emotion, onEnd);
                return;
            } catch (e) {
                console.warn("ElevenLabs streaming error, falling back to browser neural voice:", e);
            }
        }

        // 2. Browser Native Speech Synthesis (Instant, Offline)
        this.speakBrowserNative(text, emotion, onEnd);
    }

    async speakElevenLabs(text, emotion, onEnd) {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}/stream`;
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
                voice_settings: { stability: 0.65, similarity_boost: 0.75 }
            })
        });

        if (!res.ok) throw new Error("ElevenLabs request failed");

        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudioEl = audio;

        // Route to AudioContext analyser for visualizer
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

    speakBrowserNative(text, emotion, onEnd) {
        if (!this.synth) return;

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = this.synth.getVoices();
        
        // Find best English voice
        const preferredVoice = voices.find(v => 
            v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Arthur"))
        ) || voices.find(v => v.lang.startsWith("en"));

        if (preferredVoice) utterance.voice = preferredVoice;

        if (emotion === "happy") {
            utterance.pitch = 1.15;
            utterance.rate = 1.05;
        } else if (emotion === "alert") {
            utterance.pitch = 1.25;
            utterance.rate = 1.1;
        } else if (emotion === "thinking") {
            utterance.pitch = 0.95;
            utterance.rate = 0.95;
        } else {
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            if (this.onStateChangeCallback) this.onStateChangeCallback("speaking");
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (onEnd) onEnd();
            if (this.onStateChangeCallback) this.onStateChangeCallback("idle");
        };

        utterance.onerror = () => {
            this.isSpeaking = false;
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
        
        // Simulated rhythmic pulse when speaking without AudioContext
        if (this.isSpeaking) {
            return 0.35 + Math.sin(Date.now() * 0.015) * 0.25;
        }

        return 0;
    }
}

window.echoVoice = new EchoVoiceEngine();
