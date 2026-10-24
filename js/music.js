/* ==========================================================
   ECHO AMBIENT MUSIC & PROCEDURAL SOUNDSCAPE ENGINE
   Apple Music-grade floating deck + procedural audio generator
   100% offline compatible via Web Audio API synthesis
========================================================== */

class EchoMusicEngine {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.currentTrack = "Cyberpunk Rainscape";
        this.volume = 0.45;
        this.nodes = [];
        this.rainSource = null;
        this.droneOsc1 = null;
        this.droneOsc2 = null;
        this.droneGain = null;
        this.filter = null;
        this.gainNode = null;

        this.tracks = [
            { id: "rain", name: "Cyberpunk Rainscape", genre: "Atmospheric" },
            { id: "cosmic", name: "Cosmic Neural Drone", genre: "Deep Focus" },
            { id: "lofi", name: "Starlight Synthesizer", genre: "Chillwave" }
        ];
        this.currentTrackIndex = 0;
    }

    initAudioContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.gainNode = this.ctx.createGain();
                this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
                this.gainNode.connect(this.ctx.destination);

                // Pipe to voice analyzer so orb dances to music!
                if (window.echoVoice && window.echoVoice.analyser) {
                    this.gainNode.connect(window.echoVoice.analyser);
                }
            }
        }
    }

    play() {
        this.initAudioContext();
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }

        if (this.isPlaying) return;
        this.isPlaying = true;
        this.startProceduralTrack(this.tracks[this.currentTrackIndex].id);
        this.updateUI();
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.stopNodes();
        this.updateUI();
    }

    toggle() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    nextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        this.currentTrack = this.tracks[this.currentTrackIndex].name;
        if (this.isPlaying) {
            this.stopNodes();
            this.startProceduralTrack(this.tracks[this.currentTrackIndex].id);
        }
        this.updateUI();
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.gainNode && this.ctx) {
            this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    stopNodes() {
        this.nodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        });
        this.nodes = [];
    }

    startProceduralTrack(trackId) {
        if (!this.ctx || !this.gainNode) return;
        this.stopNodes();

        if (trackId === "rain") {
            // Generative Pink Noise Rain + Low Drone
            const bufferSize = this.ctx.sampleRate * 3;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
                b6 = white * 0.115926;
            }

            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const rainFilter = this.ctx.createBiquadFilter();
            rainFilter.type = "lowpass";
            rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

            whiteNoise.connect(rainFilter);
            rainFilter.connect(this.gainNode);
            whiteNoise.start();
            this.nodes.push(whiteNoise);

            // Subtle warm sub-bass pad
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
            oscGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            osc.connect(oscGain);
            oscGain.connect(this.gainNode);
            osc.start();
            this.nodes.push(osc);
        } else if (trackId === "cosmic") {
            // Dual Harmonic Binaural Drone (136.1 Hz Om tuning & 142 Hz)
            [136.1, 142.0, 272.2].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = idx === 0 ? "sine" : "triangle";
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                g.gain.setValueAtTime(0.08 / (idx + 1), this.ctx.currentTime);

                const filter = this.ctx.createBiquadFilter();
                filter.type = "lowpass";
                filter.frequency.setValueAtTime(450, this.ctx.currentTime);

                osc.connect(filter);
                filter.connect(g);
                g.connect(this.gainNode);
                osc.start();
                this.nodes.push(osc);
            });
        } else if (trackId === "lofi") {
            // Starlight Chill Synthesizer Chords
            [220, 277.18, 329.63, 440].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                
                // LFO vibrato
                const lfo = this.ctx.createOscillator();
                const lfoGain = this.ctx.createGain();
                lfo.frequency.setValueAtTime(0.2 + idx * 0.1, this.ctx.currentTime);
                lfoGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
                lfo.connect(osc.frequency);
                lfo.start();
                this.nodes.push(lfo);

                g.gain.setValueAtTime(0.06, this.ctx.currentTime);
                osc.connect(g);
                g.connect(this.gainNode);
                osc.start();
                this.nodes.push(osc);
            });
        }
    }

    updateUI() {
        const titleEl = document.getElementById("musicTrackTitle");
        const genreEl = document.getElementById("musicTrackGenre");
        const playBtn = document.getElementById("musicPlayBtn");
        const deck = document.getElementById("ambientDeck");

        if (titleEl) titleEl.textContent = this.tracks[this.currentTrackIndex].name;
        if (genreEl) genreEl.textContent = this.tracks[this.currentTrackIndex].genre;

        if (playBtn) {
            playBtn.innerHTML = this.isPlaying
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
                : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        }

        if (deck) {
            deck.classList.toggle("playing", this.isPlaying);
        }
    }
}

window.echoMusic = new EchoMusicEngine();
