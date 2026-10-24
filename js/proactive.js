/* ==========================================================
   ECHO PROACTIVE JARVIS COMPANION ENGINE
   Autonomous wellness suggestions, time awareness & idle life
========================================================== */

class EchoProactiveCompanion {
    constructor() {
        this.sessionStart = Date.now();
        this.lastInteraction = Date.now();
        this.suggestionsGiven = 0;
        this.enabled = true;

        this.init();
    }

    init() {
        // Track user activity to update lastInteraction
        window.addEventListener("mousemove", () => { this.lastInteraction = Date.now(); });
        window.addEventListener("keydown", () => { this.lastInteraction = Date.now(); });

        // Check proactive triggers every 45 seconds
        setInterval(() => this.checkProactiveState(), 45 * 1000);
    }

    getTimeGreeting() {
        const hour = new Date().getHours();
        const userName = window.echoMemory ? window.echoMemory.getUserName() : "User";

        if (hour >= 5 && hour < 12) {
            return `Good morning, ${userName}. Quantum lattice synchronized. Your daily schedule is ready.`;
        } else if (hour >= 12 && hour < 17) {
            return `Good afternoon, ${userName}. Cognitive subroutines operating at peak capacity.`;
        } else if (hour >= 17 && hour < 22) {
            return `Good evening, ${userName}. Standing by to assist with your creative work.`;
        } else {
            return `Late night session detected, ${userName}. Ambient night protocols active.`;
        }
    }

    checkProactiveState() {
        if (!this.enabled) return;

        const now = Date.now();
        const sessionMins = (now - this.sessionStart) / (1000 * 60);
        const idleSecs = (now - this.lastInteraction) / 1000;

        // 1. Idle living pulse (Echo softly sighs or shifts hue if untouched for 50s)
        if (idleSecs > 50 && idleSecs < 70) {
            if (window.echoCore && window.echoCore.getEmotion() === "idle") {
                window.echoCore.speedMultiplier = 1.6;
                setTimeout(() => {
                    if (window.echoCore) window.echoCore.speedMultiplier = 1.0;
                }, 1500);
            }
        }

        // 2. Proactive Focus Check-in (after 10 minutes of active work)
        if (sessionMins >= 10 && this.suggestionsGiven === 0) {
            this.suggestionsGiven++;
            this.triggerProactiveMessage(
                "Alok, you have been coding with intense focus for 10 minutes. Would you like me to start the Cyberpunk Rain ambient soundscape?",
                "happy"
            );
        } else if (sessionMins >= 25 && this.suggestionsGiven === 1) {
            this.suggestionsGiven++;
            this.triggerProactiveMessage(
                "System health check: Friendly reminder to hydrate, stretch your shoulders, and rest your eyes for 20 seconds.",
                "speaking"
            );
        }
    }

    triggerProactiveMessage(text, emotion = "speaking") {
        if (window.echoSounds) window.echoSounds.playResponseChime();
        if (window.echoCore) window.echoCore.setEmotion(emotion);

        const dialogueSpeaker = document.getElementById("dialogueSpeaker");
        const dialogueText = document.getElementById("dialogueText");

        if (dialogueSpeaker) dialogueSpeaker.textContent = "ECHO • PROACTIVE";
        if (dialogueText) dialogueText.textContent = text;

        if (window.echoVoice) {
            window.echoVoice.speak(text, emotion, () => {
                if (window.echoCore) window.echoCore.setEmotion("idle");
            });
        }
    }
}

window.echoProactive = new EchoProactiveCompanion();
