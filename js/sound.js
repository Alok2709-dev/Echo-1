/* ==========================================
   ECHO PROCEDURAL AUDIO SYNTHESIZER
   Apple-grade futuristic UI sound design
   100% zero-dependency Web Audio API
========================================== */

class EchoSoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            } catch (e) {
                console.warn("AudioContext init skipped:", e);
            }
        }
    }

    playTone(freq, duration, type = "sine", gainVal = 0.08, delay = 0) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }

        setTimeout(() => {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                // Smooth exponential attack and decay envelope
                gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(gainVal, this.ctx.currentTime + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {
                // Ignore audio errors
            }
        }, delay * 1000);
    }

    // Apple Intelligence activation chime (Harmonic major chord)
    playWakeChime() {
        this.playTone(523.25, 0.28, "sine", 0.07, 0);       // C5
        this.playTone(659.25, 0.32, "sine", 0.08, 0.08);    // E5
        this.playTone(783.99, 0.45, "sine", 0.09, 0.16);    // G5
    }

    // Listening confirmation tick
    playListenTick() {
        this.playTone(880, 0.12, "sine", 0.05, 0);
        this.playTone(1174.66, 0.18, "sine", 0.06, 0.06);
    }

    // Response ready bell
    playResponseChime() {
        this.playTone(783.99, 0.25, "sine", 0.06, 0);
        this.playTone(1046.50, 0.38, "sine", 0.07, 0.09);
    }

    // Alert sound
    playAlertTone() {
        this.playTone(440, 0.18, "triangle", 0.1, 0);
        this.playTone(554.37, 0.22, "triangle", 0.12, 0.12);
        this.playTone(440, 0.3, "triangle", 0.1, 0.24);
    }
}

window.echoSounds = new EchoSoundEffects();
