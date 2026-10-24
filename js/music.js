/* ==========================================================
   ECHO MUSIC DECK — MULTI-SOURCE AUDIO SYSTEM
   - 100% Offline Procedural Synthesizer
   - Spotify Direct Windows Automation & Web Player Integration
   - Apple Music Streaming & Web Station Integration
========================================================== */

class EchoMusicEngine {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.source = localStorage.getItem("echo_music_source") || "synth"; // 'synth' | 'spotify' | 'apple'
        this.currentTrack = "Cyberpunk Rainscape";
        this.volume = 0.5;
        this.nodes = [];
        this.gainNode = null;

        // Custom Spotify playlist/track URI
        this.spotifyUri = localStorage.getItem("echo_spotify_uri") || "playlist/37i9dQZF1DXcBWIGoYBM5M"; // Today's Top Hits / Lofi
        this.appleMusicUrl = localStorage.getItem("echo_apple_music_url") || "https://embed.music.apple.com/us/playlist/lo-fi-jazz/pl.u-2ak11mpt27o06q";

        this.synthTracks = [
            { id: "rain", name: "Cyberpunk Rainscape", genre: "Atmospheric Synth" },
            { id: "cosmic", name: "Cosmic Neural Drone", genre: "Deep Focus Drone" },
            { id: "lofi", name: "Starlight Synthesizer", genre: "Chillwave Chords" }
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

                if (window.echoVoice && window.echoVoice.analyser) {
                    this.gainNode.connect(window.echoVoice.analyser);
                }
            }
        }
    }

    setSource(newSource) {
        if (this.source === newSource) return;
        this.pause();
        this.source = newSource;
        localStorage.setItem("echo_music_source", newSource);
        this.updateUI();
    }

    play() {
        if (this.source === "spotify") {
            this.playSpotify();
            return;
        }
        if (this.source === "apple") {
            this.playAppleMusic();
            return;
        }

        // Default: Synth
        this.initAudioContext();
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }

        if (this.isPlaying) return;
        this.isPlaying = true;
        this.startProceduralTrack(this.synthTracks[this.currentTrackIndex].id);
        this.updateUI();
    }

    pause() {
        if (this.source === "spotify") {
            this.pauseSpotify();
            return;
        }
        if (this.source === "apple") {
            this.pauseAppleMusic();
            return;
        }

        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.stopNodes();
        this.updateUI();
    }

    toggle() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    // Spotify Integration
    playSpotify(query = "") {
        this.source = "spotify";
        this.isPlaying = true;
        this.currentTrack = query ? `Spotify: ${query}` : "Spotify Connected";

        const iframe = document.getElementById("spotifyEmbedFrame");
        const embedContainer = document.getElementById("musicEmbedContainer");

        if (query) {
            // If native desktop bridge is available, launch Spotify desktop directly to song!
            if (window.echoOSBridge) {
                window.echoOSBridge.execute("spotify", `spotify:search:${encodeURIComponent(query)}`);
            }
            // Also open web player or update iframe
            if (iframe && embedContainer) {
                embedContainer.classList.remove("hidden");
                iframe.src = `https://open.spotify.com/embed/search/${encodeURIComponent(query)}`;
            } else {
                window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, "_blank");
            }
        } else {
            // Default Spotify playlist
            if (embedContainer && iframe) {
                embedContainer.classList.remove("hidden");
                if (!iframe.src || iframe.src === "about:blank") {
                    iframe.src = `https://open.spotify.com/embed/${this.spotifyUri}?utm_source=generator&theme=0`;
                }
            } else {
                window.open("https://open.spotify.com", "_blank");
            }
        }

        this.updateUI();
    }

    pauseSpotify() {
        this.isPlaying = false;
        const embedContainer = document.getElementById("musicEmbedContainer");
        if (embedContainer) embedContainer.classList.add("hidden");
        this.updateUI();
    }

    // Apple Music Integration
    playAppleMusic() {
        this.source = "apple";
        this.isPlaying = true;
        this.currentTrack = "Apple Music Station";

        const appleFrame = document.getElementById("appleMusicFrame");
        const embedContainer = document.getElementById("musicEmbedContainer");

        if (embedContainer && appleFrame) {
            embedContainer.classList.remove("hidden");
            if (!appleFrame.src || appleFrame.src === "about:blank") {
                appleFrame.src = this.appleMusicUrl;
            }
        } else {
            window.open("https://music.apple.com", "_blank");
        }

        this.updateUI();
    }

    pauseAppleMusic() {
        this.isPlaying = false;
        const embedContainer = document.getElementById("musicEmbedContainer");
        if (embedContainer) embedContainer.classList.add("hidden");
        this.updateUI();
    }

    nextTrack() {
        if (this.source === "synth") {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.synthTracks.length;
            this.currentTrack = this.synthTracks[this.currentTrackIndex].name;
            if (this.isPlaying) {
                this.stopNodes();
                this.startProceduralTrack(this.synthTracks[this.currentTrackIndex].id);
            }
        } else if (this.source === "spotify") {
            if (window.echoOSBridge) window.echoOSBridge.execute("spotify");
        }
        this.updateUI();
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
            this.startRainSynth();
        } else if (trackId === "cosmic") {
            this.startCosmicDrone();
        } else if (trackId === "lofi") {
            this.startLofiSynth();
        }
    }

    startRainSynth() {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }

        const rain = this.ctx.createBufferSource();
        rain.buffer = buffer;
        rain.loop = true;

        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = "lowpass";
        rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

        const rainGain = this.ctx.createGain();
        rainGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

        rain.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(this.gainNode);

        rain.start();
        this.nodes.push(rain, rainFilter, rainGain);

        // Sub bass drone pad
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(55, this.ctx.currentTime);
        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(this.gainNode);
        osc.start();
        this.nodes.push(osc, oscGain);
    }

    startCosmicDrone() {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = "triangle";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(108, this.ctx.currentTime);
        osc2.frequency.setValueAtTime(110.5, this.ctx.currentTime); // 2.5Hz binaural beat

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.gainNode);

        osc1.start();
        osc2.start();
        this.nodes.push(osc1, osc2, filter, gain);
    }

    startLofiSynth() {
        const chords = [130.81, 164.81, 196.00]; // C minor warm chord
        chords.forEach(freq => {
            const osc = this.ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            const filter = this.ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(450, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.gainNode);

            osc.start();
            this.nodes.push(osc, filter, gain);
        });
    }

    updateUI() {
        const titleEl = document.getElementById("musicTrackTitle");
        const genreEl = document.getElementById("musicTrackGenre");
        const deck = document.getElementById("ambientDeck");
        const playBtn = document.getElementById("musicPlayBtn");

        if (titleEl) titleEl.textContent = this.currentTrack;
        if (genreEl) {
            const labels = { "synth": "Echo Ambient Deck", "spotify": "Spotify Live", "apple": "Apple Music" };
            genreEl.textContent = labels[this.source] || "Ambient";
        }
        if (deck) deck.classList.toggle("playing", this.isPlaying);
        if (playBtn) {
            playBtn.innerHTML = this.isPlaying
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
                : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        }
    }
}

window.echoMusic = new EchoMusicEngine();
