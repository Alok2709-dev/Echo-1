/* ==========================================================
   ECHO HANDS-FREE WAKE WORD ENGINE
   Always-on background listener for "Hey Echo" / "Echo"
========================================================== */

class EchoWakeWordEngine {
    constructor() {
        this.isEnabled = localStorage.getItem("echo_wakeword_enabled") !== "false"; // Default true
        this.recognition = null;
        this.isListening = false;
        this.restartTimeout = null;

        this.wakePatterns = [
            /^hey\s+echo/i,
            /^ok\s+echo/i,
            /^hello\s+echo/i,
            /^sun\s+echo/i,
            /^suno\s+echo/i,
            /^echo\b/i
        ];

        this.init();
    }

    init() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn("[EchoWakeWord] Web Speech API not available.");
            return;
        }

        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";

        this.recognition.onstart = () => {
            this.isListening = true;
            console.log("[EchoWakeWord] Background acoustic wake-word listener active.");
            this.updateBadge(true);
        };

        this.recognition.onresult = (event) => {
            // If primary voice synthesis is speaking, don't trigger wake word on our own voice
            if (window.echoVoice && window.echoVoice.isSpeaking) return;

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript.trim().toLowerCase();
                const isFinal = event.results[i].isFinal;

                for (let pattern of this.wakePatterns) {
                    if (pattern.test(transcript)) {
                        console.log(`[EchoWakeWord] Wake word detected: "${transcript}"`);
                        
                        // Extract remaining command after wake word if present
                        let command = transcript.replace(pattern, "").trim().replace(/^[,.]/, "").trim();

                        this.triggerWake(command);
                        return;
                    }
                }
            }
        };

        this.recognition.onerror = (event) => {
            // Auto restart on network/audio hiccup if enabled
            if (event.error !== "not-allowed" && event.error !== "aborted") {
                this.scheduleRestart();
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateBadge(false);
            if (this.isEnabled) {
                this.scheduleRestart();
            }
        };

        if (this.isEnabled) {
            // Delayed start to let UI finish boot
            setTimeout(() => this.start(), 1500);
        }
    }

    start() {
        if (!this.recognition || this.isListening) return;
        try {
            this.recognition.start();
        } catch (e) {
            this.scheduleRestart();
        }
    }

    stop() {
        this.isEnabled = false;
        localStorage.setItem("echo_wakeword_enabled", "false");
        clearTimeout(this.restartTimeout);
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        this.updateBadge(false);
    }

    enable() {
        this.isEnabled = true;
        localStorage.setItem("echo_wakeword_enabled", "true");
        this.start();
    }

    toggle() {
        if (this.isEnabled) this.stop();
        else this.enable();
    }

    scheduleRestart() {
        clearTimeout(this.restartTimeout);
        if (!this.isEnabled) return;
        this.restartTimeout = setTimeout(() => {
            if (!this.isListening) this.start();
        }, 1200);
    }

    triggerWake(accompanyingCommand = "") {
        // Play wake chime
        if (window.echoSounds) window.echoSounds.playWakeChime();

        // Shift orb to listening neon glow
        if (window.echoCore) window.echoCore.setEmotion("listening");

        // Aurora border flash
        const aurora = document.getElementById("auroraBorder");
        if (aurora) {
            aurora.classList.add("active");
            setTimeout(() => aurora.classList.remove("active"), 2000);
        }

        const userName = window.echoMemory ? window.echoMemory.getUserName() : "Alok";

        if (accompanyingCommand && accompanyingCommand.length > 2) {
            // User said: "Hey Echo, play Spotify" or "Hey Echo, what's on my calendar?"
            if (window.handleUserMessage) {
                window.handleUserMessage(accompanyingCommand);
            }
        } else {
            // User just said: "Hey Echo"
            const replies = [
                `Yes, ${userName}? I'm listening.`,
                `Online, ${userName}. What's on your mind?`,
                `At your command, ${userName}.`,
                `All neural subsystems active. Tell me what to do.`
            ];
            const chosen = replies[Math.floor(Math.random() * replies.length)];
            
            const dialogueSpeaker = document.getElementById("dialogueSpeaker");
            const dialogueText = document.getElementById("dialogueText");
            if (dialogueSpeaker) dialogueSpeaker.textContent = "ECHO";
            if (dialogueText) dialogueText.textContent = chosen;

            if (window.echoVoice) {
                window.echoVoice.speak(chosen, "happy", () => {
                    // Activate mic listening for their follow up instruction!
                    if (window.echoVoice && !window.echoVoice.isListening) {
                        window.echoVoice.toggleListening();
                    }
                });
            }
        }
    }

    updateBadge(active) {
        const badge = document.getElementById("wakeWordStatusBadge");
        if (badge) {
            badge.textContent = active ? "Always Listening" : "Muted";
            badge.className = `status-badge ${active ? 'active' : 'inactive'}`;
        }
    }
}

window.echoWakeWord = new EchoWakeWordEngine();
