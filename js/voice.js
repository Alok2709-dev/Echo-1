/* ==========================================
   ECHO VOICE & AUDIO REACTIVITY ENGINE
========================================== */

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
        this.audioLevel = 0; // 0.0 to 1.0
        this.onTranscriptCallback = null;
        this.onStateChangeCallback = null;

        this.initSpeechRecognition();
        this.initAudioContext();
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
            console.warn("Could not attach microphone to Web Audio analyzer:", e);
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
            alert("Speech Recognition is not supported on this browser. You can still type in the command bar!");
            return false;
        }

        if (this.isListening) {
            this.recognition.stop();
            return false;
        } else {
            try {
                this.synth.cancel(); // Stop speaking if Echo was talking
                this.recognition.start();
                return true;
            } catch (e) {
                console.error("Failed to start speech recognition:", e);
                return false;
            }
        }
    }

    speak(text, emotion = "idle", onEnd = null) {
        if (!this.synth) return;
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Pick best available English voice
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => 
            v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel"))
        ) || voices.find(v => v.lang.startsWith("en"));

        if (preferredVoice) utterance.voice = preferredVoice;

        // Tune speech pitch based on emotion
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
            return 0.35 + Math.sin(Date.now() * 0.012) * 0.25;
        }

        return 0;
    }
}

window.echoVoice = new EchoVoiceEngine();
