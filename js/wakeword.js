/* ==========================================================
   ECHO WAKE WORD BRIDGE (Unified with Master Voice Engine)
========================================================== */

class EchoWakeWordEngine {
    constructor() {
        this.isEnabled = localStorage.getItem("echo_wakeword_enabled") !== "false";
    }

    start() {
        this.isEnabled = true;
        localStorage.setItem("echo_wakeword_enabled", "true");
        if (window.echoVoice) window.echoVoice.isWakeWordActive = true;
        this.updateBadge(true);
    }

    stop() {
        this.isEnabled = false;
        localStorage.setItem("echo_wakeword_enabled", "false");
        if (window.echoVoice) window.echoVoice.isWakeWordActive = false;
        this.updateBadge(false);
    }

    toggle() {
        if (this.isEnabled) this.stop();
        else this.start();
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
