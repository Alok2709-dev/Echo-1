/* ==========================================================
   ECHO — SENTIENT CYBER-KINETIC LIVING ENTITY (v4.0 Character Engine)
   - 3D Holographic Gyroscopic Orbital Gimbal Rings with Parallax Tilt
   - Sentient Biomorphic Eye with Mouse-Tracking Pupil & Organic Blinking
   - Dynamic Audio-Reactive Plasma Corona & Sonic Resonator Rays
   - Emotion-Morphing Geometry (Serene, Listening, Thinking, Speaking, Euphoria, Alert)
   - Interactive Energy Arc Proximity & Kinetic Shockwaves
========================================================== */

class EchoLivingCore {
    constructor() {
        this.canvas = document.getElementById("coreCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Character Emotion Palettes
        this.palettes = {
            idle: {
                primary: [0, 229, 255],     // Electric Cyan
                secondary: [147, 51, 234],  // Royal Purple
                tertiary: [255, 45, 85],    // Neon Rose
                speed: 1.0,
                label: "Neural Core • Sentient & Serene"
            },
            listening: {
                primary: [0, 255, 204],     // Fluorescent Teal
                secondary: [0, 122, 255],   // Apple Azure
                tertiary: [255, 235, 59],   // Gold Spark
                speed: 1.8,
                label: "Sensory Matrix • Listening..."
            },
            thinking: {
                primary: [168, 85, 247],    // Deep Violet
                secondary: [236, 72, 153],  // Hot Pink
                tertiary: [99, 102, 241],   // Indigo
                speed: 2.8,
                label: "Cognitive Engine • Computing..."
            },
            speaking: {
                primary: [255, 171, 64],    // Solar Amber
                secondary: [255, 82, 82],   // Coral Red
                tertiary: [255, 235, 59],   // Golden Light
                speed: 1.7,
                label: "Vocal Synthesizer • Speaking"
            },
            happy: {
                primary: [16, 185, 129],    // Emerald Neon
                secondary: [6, 182, 212],   // Cyan Blue
                tertiary: [245, 158, 11],   // Warm Sun
                speed: 2.0,
                label: "Resonance Matrix • Euphoria"
            },
            alert: {
                primary: [239, 68, 68],     // Crimson Red
                secondary: [249, 115, 22],  // Amber Flame
                tertiary: [255, 255, 255],  // White Flash
                speed: 3.5,
                label: "System Status • Warning Alert"
            }
        };

        this.currentEmotion = "idle";
        
        // Dynamic interpolated color channels
        this.c1 = [...this.palettes.idle.primary];
        this.c2 = [...this.palettes.idle.secondary];
        this.c3 = [...this.palettes.idle.tertiary];

        this.targetC1 = [...this.palettes.idle.primary];
        this.targetC2 = [...this.palettes.idle.secondary];
        this.targetC3 = [...this.palettes.idle.tertiary];

        this.speed = 1.0;
        this.targetSpeed = 1.0;
        this.time = 0;

        // Interactive mouse & gaze tracking
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, rawX: 0, rawY: 0, isHovered: false };
        this.pupil = { x: 0, y: 0, targetX: 0, targetY: 0, dilation: 1.0 };
        this.audioEnergy = 0;

        // Sentient blinking system
        this.blinkProgress = 0; // 0 = wide open, 1 = fully shut
        this.isBlinking = false;
        this.lastBlinkTime = Date.now();
        this.nextBlinkInterval = 4000 + Math.random() * 3000;

        // Interactive shockwaves
        this.shockwaves = [];

        // Ambient cyber dust particles
        this.particles = [];
        this.initParticles(75);

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener("resize", () => this.resize());

        window.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const canvasCenterX = rect.left + rect.width / 2;
            const canvasCenterY = rect.top + rect.height / 2;

            const dx = e.clientX - canvasCenterX;
            const dy = e.clientY - canvasCenterY;
            const dist = Math.hypot(dx, dy);

            this.mouse.rawX = e.clientX;
            this.mouse.rawY = e.clientY;
            this.mouse.targetX = dx * 0.08;
            this.mouse.targetY = dy * 0.08;
            this.mouse.isHovered = dist < 260;

            // Constrain pupil tracking within natural eye radius
            const maxPupilOffset = 26;
            const pupilAngle = Math.atan2(dy, dx);
            const pupilDist = Math.min(dist * 0.09, maxPupilOffset);
            this.pupil.targetX = Math.cos(pupilAngle) * pupilDist;
            this.pupil.targetY = Math.sin(pupilAngle) * pupilDist;
        });

        // Click interaction: Shockwave burst + toggle voice listening
        this.canvas.addEventListener("click", () => {
            this.triggerShockwave();
            if (window.echoVoice) {
                window.echoVoice.toggleListening();
            }
        });

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    triggerShockwave() {
        this.shockwaves.push({
            radius: 20,
            maxRadius: 240,
            alpha: 1.0,
            speed: 6.5
        });
        if (window.echoSounds) {
            window.echoSounds.playListenTick();
        }
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = 620;
        this.height = 620;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    initParticles(count) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 190;
            this.particles.push({
                angle: angle,
                dist: dist,
                size: 0.8 + Math.random() * 2.2,
                speed: (0.004 + Math.random() * 0.008) * (Math.random() > 0.5 ? 1 : -1),
                pulseOffset: Math.random() * Math.PI * 2,
                alpha: 0.2 + Math.random() * 0.7
            });
        }
    }

    setEmotion(name) {
        if (!this.palettes[name]) return;
        this.currentEmotion = name;
        const p = this.palettes[name];
        this.targetC1 = [...p.primary];
        this.targetC2 = [...p.secondary];
        this.targetC3 = [...p.tertiary];
        this.targetSpeed = p.speed;

        // Update emotion indicator badge
        const badge = document.querySelector(".emotion-tag");
        if (badge) {
            badge.textContent = p.label;
            badge.style.color = `rgb(${p.primary.join(",")})`;
            badge.style.borderColor = `rgba(${p.primary.join(",")}, 0.35)`;
            badge.style.backgroundColor = `rgba(${p.primary.join(",")}, 0.12)`;
        }

        // Update Apple Aurora screen border
        const aurora = document.getElementById("auroraBorder");
        if (aurora) {
            aurora.style.setProperty("--c1", `rgb(${p.primary.join(",")})`);
            aurora.style.setProperty("--c2", `rgb(${p.secondary.join(",")})`);
            aurora.style.setProperty("--c3", `rgb(${p.tertiary.join(",")})`);
            if (name === "listening" || name === "speaking" || name === "alert") {
                aurora.classList.add("active");
            } else {
                aurora.classList.remove("active");
            }
        }
    }

    lerpColor(current, target, factor) {
        for (let i = 0; i < 3; i++) {
            current[i] += (target[i] - current[i]) * factor;
        }
    }

    updateBlink() {
        const now = Date.now();
        if (!this.isBlinking && now - this.lastBlinkTime > this.nextBlinkInterval) {
            this.isBlinking = true;
            this.blinkStartTime = now;
            this.blinkDuration = 180; // Fast organic 180ms blink
        }

        if (this.isBlinking) {
            const elapsed = now - this.blinkStartTime;
            const t = elapsed / this.blinkDuration;
            if (t >= 1) {
                this.isBlinking = false;
                this.blinkProgress = 0;
                this.lastBlinkTime = now;
                this.nextBlinkInterval = 3500 + Math.random() * 4000;
            } else {
                // Smooth sine curve for blink closing and opening
                this.blinkProgress = Math.sin(t * Math.PI);
            }
        }
    }

    animate() {
        const lerpFactor = 0.07;
        this.lerpColor(this.c1, this.targetC1, lerpFactor);
        this.lerpColor(this.c2, this.targetC2, lerpFactor);
        this.lerpColor(this.c3, this.targetC3, lerpFactor);
        this.speed += (this.targetSpeed - this.speed) * 0.05;

        // Smooth cursor tilt & pupil tracking inertia
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.09;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.09;
        this.pupil.x += (this.pupil.targetX - this.pupil.x) * 0.12;
        this.pupil.y += (this.pupil.targetY - this.pupil.y) * 0.12;

        // Audio reactivity
        const rawAudio = window.echoVoice ? window.echoVoice.getAudioLevel() : 0;
        this.audioEnergy += (rawAudio - this.audioEnergy) * 0.28;

        // Dilation calculation
        let targetDilation = 1.0 + this.audioEnergy * 0.45;
        if (this.currentEmotion === "listening") targetDilation += 0.35;
        else if (this.currentEmotion === "thinking") targetDilation -= 0.2;
        else if (this.currentEmotion === "happy") targetDilation += 0.25;
        this.pupil.dilation += (targetDilation - this.pupil.dilation) * 0.1;

        this.updateBlink();
        this.time += 0.02 * this.speed;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const centerX = this.width / 2 + this.mouse.x;
        const centerY = this.height / 2 + this.mouse.y;

        ctx.save();
        ctx.translate(centerX, centerY);

        const rgb1 = this.c1.map(Math.round).join(",");
        const rgb2 = this.c2.map(Math.round).join(",");
        const rgb3 = this.c3.map(Math.round).join(",");

        // 1. DEEP AMBIENT VOLUMETRIC AURA GLOW
        const auraRadius = 210 + Math.sin(this.time * 1.5) * 15 + this.audioEnergy * 40;
        const auraGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, auraRadius);
        auraGrad.addColorStop(0, `rgba(${rgb1}, 0.25)`);
        auraGrad.addColorStop(0.5, `rgba(${rgb2}, 0.12)`);
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. ORBITING DATA PARTICLES / QUANTUM RUNES
        ctx.save();
        for (let p of this.particles) {
            p.angle += p.speed * this.speed;
            const dist = p.dist + Math.sin(this.time + p.pulseOffset) * 12 + this.audioEnergy * 25;
            const px = Math.cos(p.angle) * dist;
            const py = Math.sin(p.angle) * dist * 0.85; // subtle isometric perspective

            ctx.beginPath();
            ctx.arc(px, py, p.size + (this.audioEnergy * 1.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb1}, ${p.alpha * (0.6 + Math.sin(this.time * 2 + p.pulseOffset) * 0.4)})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `rgb(${rgb1})`;
            ctx.fill();
        }
        ctx.restore();

        // 3. RADIAL AUDIO PLASMA CORONA RAYS (360° Vocal Resonator)
        this.drawAudioCoronaRays(ctx, rgb1, rgb2);

        // 4. 3D GYROSCOPIC GIMBAL ORBITAL RINGS
        this.drawGyroscopicRings(ctx, rgb1, rgb2, rgb3);

        // 5. SENTIENT EYE CORE (Iris, Pupil Tracking & Blinking)
        this.drawSentientEye(ctx, rgb1, rgb2, rgb3);

        // 6. SHOCKWAVE EXPANSIONS
        this.drawShockwaves(ctx, rgb1);

        ctx.restore();

        requestAnimationFrame(this.animate);
    }

    // 360-degree acoustic plasma corona erupting outward
    drawAudioCoronaRays(ctx, rgb1, rgb2) {
        const rayCount = 48;
        const baseRadius = 105;
        const audioAmp = 18 + this.audioEnergy * 65;

        ctx.save();
        ctx.lineWidth = 1.5;

        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2 + this.time * 0.4;
            const rayNoise = Math.sin(angle * 7 + this.time * 4) * 8;
            const rayLen = baseRadius + audioAmp * (0.4 + Math.sin(i * 3 + this.time * 5) * 0.6) + rayNoise;

            const x1 = Math.cos(angle) * (baseRadius - 10);
            const y1 = Math.sin(angle) * (baseRadius - 10);
            const x2 = Math.cos(angle) * rayLen;
            const y2 = Math.sin(angle) * rayLen;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = (i % 2 === 0) ? `rgba(${rgb1}, ${0.35 + this.audioEnergy * 0.5})` : `rgba(${rgb2}, ${0.25 + this.audioEnergy * 0.4})`;
            ctx.stroke();
        }
        ctx.restore();
    }

    // 3D Gyroscopic Orbital Halo Rings with Parallax Tilt
    drawGyroscopicRings(ctx, rgb1, rgb2, rgb3) {
        ctx.save();
        
        // Tilt angles responding to mouse tracking
        const tiltX = (this.mouse.y / 20) * (Math.PI / 180);
        const tiltY = (this.mouse.x / 20) * (Math.PI / 180);

        // Ring 1: Outer Telemetry Orbit Ring (Radius ~165)
        ctx.save();
        ctx.rotate(this.time * 0.35 + tiltY);
        ctx.scale(1.0, 0.45 + Math.sin(this.time * 0.2) * 0.08); // 3D perspective slant
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = `rgba(${rgb1}, 0.55)`;
        ctx.shadowBlur = 14;
        ctx.shadowColor = `rgb(${rgb1})`;

        // Segmented ring
        ctx.beginPath();
        ctx.arc(0, 0, 168, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 168, Math.PI * 1.6, Math.PI * 1.95);
        ctx.stroke();

        // Orbiting Sensor Nodes on Ring 1
        const nodeAngle1 = this.time * 1.2;
        const nx1 = Math.cos(nodeAngle1) * 168;
        const ny1 = Math.sin(nodeAngle1) * 168;
        ctx.beginPath();
        ctx.arc(nx1, ny1, 4 + this.audioEnergy * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${rgb3})`;
        ctx.fill();

        ctx.restore();

        // Ring 2: Counter-Rotating Gyro Ring (Radius ~135)
        ctx.save();
        ctx.rotate(-this.time * 0.55 - tiltX);
        ctx.scale(0.55 + Math.cos(this.time * 0.25) * 0.08, 1.0);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = `rgba(${rgb2}, 0.65)`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgb(${rgb2})`;

        // Dashed ring arcs
        ctx.setLineDash([12, 10, 4, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, 136, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting Node on Ring 2
        const nodeAngle2 = -this.time * 1.6;
        const nx2 = Math.cos(nodeAngle2) * 136;
        const ny2 = Math.sin(nodeAngle2) * 136;
        ctx.beginPath();
        ctx.arc(nx2, ny2, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.restore();

        // Ring 3: Inner Focal Reticle Ring (Radius ~105)
        ctx.save();
        ctx.rotate(this.time * 0.8);
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = `rgba(${rgb1}, 0.75)`;
        ctx.shadowBlur = 16;
        ctx.shadowColor = `rgb(${rgb1})`;

        // 4 Cardinal bracket reticles
        for (let i = 0; i < 4; i++) {
            const rot = (i * Math.PI) / 2;
            ctx.save();
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.arc(0, 0, 104, -0.22, 0.22);
            ctx.stroke();

            // Reticle tick
            ctx.beginPath();
            ctx.moveTo(100, 0);
            ctx.lineTo(110, 0);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        ctx.restore();
    }

    // Sentient Eye Core (Holographic Iris, Cursor-Tracking Pupil & Blinking)
    drawSentientEye(ctx, rgb1, rgb2, rgb3) {
        ctx.save();

        const eyeRadius = 78 + this.audioEnergy * 15;
        const blinkScaleY = Math.max(0.04, 1.0 - this.blinkProgress * 0.96);

        // Apply organic eyelid blink transform
        ctx.scale(1.0, blinkScaleY);

        // 1. Iris Base Sphere with Rich Radial Depth
        const irisGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, eyeRadius);
        irisGrad.addColorStop(0, `rgba(${rgb1}, 0.95)`);
        irisGrad.addColorStop(0.45, `rgba(${rgb2}, 0.85)`);
        irisGrad.addColorStop(0.85, `rgba(${rgb3}, 0.5)`);
        irisGrad.addColorStop(1, `rgba(0, 0, 0, 0.85)`);

        ctx.beginPath();
        ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = irisGrad;
        ctx.shadowBlur = 30 + this.audioEnergy * 25;
        ctx.shadowColor = `rgb(${rgb1})`;
        ctx.fill();

        // 2. Iris Internal Optical Fibrils (Glowing crystalline neural strands)
        ctx.save();
        ctx.lineWidth = 1.0;
        const strandCount = 36;
        for (let i = 0; i < strandCount; i++) {
            const angle = (i / strandCount) * Math.PI * 2 + this.time * 0.25;
            const len = eyeRadius * (0.65 + Math.sin(angle * 5 + this.time * 2) * 0.3);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
            ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + Math.sin(this.time * 3 + i) * 0.12})`;
            ctx.stroke();
        }
        ctx.restore();

        // 3. Sentient Living Pupil (Tracks Cursor Coordinates in Real-time)
        const pupilRadius = (26 + this.audioEnergy * 10) * this.pupil.dilation;
        const px = this.pupil.x;
        const py = this.pupil.y;

        // Pupil Outer Shadow Depth
        const pupilGrad = ctx.createRadialGradient(px, py, 2, px, py, pupilRadius);
        pupilGrad.addColorStop(0, "#ffffff");
        pupilGrad.addColorStop(0.35, `rgba(${rgb1}, 0.95)`);
        pupilGrad.addColorStop(0.8, "#050508");
        pupilGrad.addColorStop(1, "#000000");

        ctx.beginPath();
        ctx.arc(px, py, pupilRadius, 0, Math.PI * 2);
        ctx.fillStyle = pupilGrad;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgb(${rgb1})`;
        ctx.fill();

        // 4. Parallax Holographic Specular Glints (Creates living biological wetness & glass reflection)
        const glint1X = px - pupilRadius * 0.35;
        const glint1Y = py - pupilRadius * 0.35;
        ctx.beginPath();
        ctx.arc(glint1X, glint1Y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fill();

        const glint2X = px + pupilRadius * 0.38;
        const glint2Y = py + pupilRadius * 0.32;
        ctx.beginPath();
        ctx.arc(glint2X, glint2Y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.fill();

        // 5. Emotion-Specific Iris Glyphs
        if (this.currentEmotion === "thinking") {
            // Spinning computational cyber vortex in iris
            ctx.save();
            ctx.rotate(this.time * 4);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = `rgba(${rgb3}, 0.8)`;
            ctx.beginPath();
            ctx.arc(px, py, pupilRadius + 14, 0, Math.PI * 1.2);
            ctx.stroke();
            ctx.restore();
        } else if (this.currentEmotion === "alert") {
            // Defensive angular brackets
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#ff2222";
            ctx.strokeRect(-eyeRadius - 8, -eyeRadius - 8, (eyeRadius + 8) * 2, (eyeRadius + 8) * 2);
        }

        ctx.restore();
    }

    drawShockwaves(ctx, rgb1) {
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed;
            sw.alpha *= 0.93;

            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${rgb1}, ${sw.alpha})`;
            ctx.lineWidth = 3.5;
            ctx.shadowBlur = 20;
            ctx.shadowColor = `rgb(${rgb1})`;
            ctx.stroke();
            ctx.restore();

            if (sw.alpha < 0.02 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.echoCore = new EchoLivingCore();
});

window.addEventListener("DOMContentLoaded", () => {
    window.echoCore = new EchoLivingCore();
});
