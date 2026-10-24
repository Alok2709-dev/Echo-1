/* ==========================================================
   ECHO — APPLE INTELLIGENCE FLUID LIVING ORB & AURORA ENGINE
   Hyper-smooth 60fps organic plasma physics + audio reactivity
========================================================== */

class EchoLivingCore {
    constructor() {
        this.canvas = document.getElementById("coreCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Palette presets (Apple Intelligence inspired gradients)
        this.palettes = {
            idle: {
                primary: [0, 229, 255],     // Electric Cyan
                secondary: [147, 51, 234],  // Royal Purple
                tertiary: [255, 45, 85],    // Neon Rose
                speed: 1.0,
                label: "Neural Core • Active & Serene"
            },
            listening: {
                primary: [0, 255, 204],     // Fluorescent Teal
                secondary: [0, 122, 255],   // Apple Azure
                tertiary: [255, 255, 255],  // White Hot
                speed: 1.8,
                label: "Sensory Matrix • Listening..."
            },
            thinking: {
                primary: [168, 85, 247],    // Deep Violet
                secondary: [236, 72, 153],  // Hot Pink
                tertiary: [99, 102, 241],   // Indigo
                speed: 2.5,
                label: "Cognitive Engine • Computing..."
            },
            speaking: {
                primary: [255, 171, 64],    // Solar Amber
                secondary: [255, 82, 82],   // Coral Red
                tertiary: [255, 235, 59],   // Golden Light
                speed: 1.6,
                label: "Vocal Synthesizer • Speaking"
            },
            happy: {
                primary: [16, 185, 129],    // Emerald Neon
                secondary: [6, 182, 212],   // Cyan Blue
                tertiary: [245, 158, 11],   // Warm Sun
                speed: 1.9,
                label: "Resonance Matrix • Euphoria"
            },
            alert: {
                primary: [239, 68, 68],     // Crimson Red
                secondary: [249, 115, 22],  // Amber Flame
                tertiary: [255, 255, 255],  // Flash
                speed: 3.2,
                label: "System Status • Warning Alert"
            }
        };

        this.currentEmotion = "idle";
        
        // Interpolated color channels
        this.c1 = [...this.palettes.idle.primary];
        this.c2 = [...this.palettes.idle.secondary];
        this.c3 = [...this.palettes.idle.tertiary];

        this.targetC1 = [...this.palettes.idle.primary];
        this.targetC2 = [...this.palettes.idle.secondary];
        this.targetC3 = [...this.palettes.idle.tertiary];

        this.speed = 1.0;
        this.targetSpeed = 1.0;

        this.time = 0;
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.audioEnergy = 0;

        // Ambient particles / stardust
        this.particles = [];
        this.initParticles(90);

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener("resize", () => this.resize());

        window.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.targetX = (e.clientX - (rect.left + rect.width / 2)) * 0.12;
            this.mouse.targetY = (e.clientY - (rect.top + rect.height / 2)) * 0.12;
        });

        // Click orb to toggle voice
        this.canvas.addEventListener("click", () => {
            if (window.echoVoice) {
                window.echoVoice.toggleListening();
            }
        });

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
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
            const dist = 70 + Math.random() * 160;
            this.particles.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                size: 0.8 + Math.random() * 2.2,
                angle: angle,
                speed: 0.003 + Math.random() * 0.009,
                orbitRadius: dist,
                alpha: 0.2 + Math.random() * 0.7,
                pulseOffset: Math.random() * Math.PI * 2
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
            badge.style.color = `rgb(${p.primary[0]}, ${p.primary[1]}, ${p.primary[2]})`;
            badge.style.borderColor = `rgba(${p.primary[0]}, ${p.primary[1]}, ${p.primary[2]}, 0.35)`;
            badge.style.backgroundColor = `rgba(${p.primary[0]}, ${p.primary[1]}, ${p.primary[2]}, 0.12)`;
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

    animate() {
        const lerpFactor = 0.06;
        this.lerpColor(this.c1, this.targetC1, lerpFactor);
        this.lerpColor(this.c2, this.targetC2, lerpFactor);
        this.lerpColor(this.c3, this.targetC3, lerpFactor);
        this.speed += (this.targetSpeed - this.speed) * 0.05;

        // Mouse spring tilt
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

        // Audio reactivity
        const rawAudio = window.echoVoice ? window.echoVoice.getAudioLevel() : 0;
        this.audioEnergy += (rawAudio - this.audioEnergy) * 0.25;

        this.time += 0.02 * this.speed;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const centerX = this.width / 2 + this.mouse.x;
        const centerY = this.height / 2 + this.mouse.y;

        ctx.save();
        ctx.translate(centerX, centerY);

        // 1. AMBIENT AURA GLOW (Subtle soft radial dispersion)
        const auraRadius = 190 + Math.sin(this.time * 1.5) * 15 + this.audioEnergy * 45;
        const auraGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, auraRadius);
        auraGrad.addColorStop(0, `rgba(${this.c1.map(Math.round).join(",")}, 0.22)`);
        auraGrad.addColorStop(0.5, `rgba(${this.c2.map(Math.round).join(",")}, 0.12)`);
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. ORBITING STARDUST PARTICLES
        for (let p of this.particles) {
            p.angle += p.speed * this.speed;
            const dist = p.orbitRadius + Math.sin(this.time + p.pulseOffset) * 12 + this.audioEnergy * 25;
            const px = Math.cos(p.angle) * dist;
            const py = Math.sin(p.angle) * dist;

            ctx.beginPath();
            ctx.arc(px, py, p.size + (this.audioEnergy * 1.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.c1.map(Math.round).join(",")}, ${p.alpha * (0.5 + Math.sin(this.time * 2 + p.pulseOffset) * 0.3)})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = `rgb(${this.c1.map(Math.round).join(",")})`;
            ctx.fill();
        }

        // 3. ORGANIC FLUID PLASMA MORPHING ORB (Apple Intelligence Core)
        ctx.globalCompositeOperation = "screen";

        this.drawMorphingBlob(ctx, 85 + this.audioEnergy * 35, this.c1, 0, 1.0);
        this.drawMorphingBlob(ctx, 75 + this.audioEnergy * 28, this.c2, Math.PI * 0.7, 0.85);
        this.drawMorphingBlob(ctx, 60 + this.audioEnergy * 20, this.c3, Math.PI * 1.4, 0.95);

        // 4. INNER RADIANT EMBEDDED LIGHT
        const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 45 + this.audioEnergy * 15);
        coreGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        coreGlow.addColorStop(0.4, `rgba(${this.c1.map(Math.round).join(",")}, 0.8)`);
        coreGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 45 + this.audioEnergy * 15, 0, Math.PI * 2);
        ctx.fill();

        // 5. APPLE SIRI FLUID WAVE RIBBONS
        this.drawSiriRibbons(ctx);

        ctx.restore();
        ctx.globalCompositeOperation = "source-over";

        requestAnimationFrame(this.animate);
    }

    drawMorphingBlob(ctx, baseRadius, rgb, phaseOffset, alpha) {
        ctx.beginPath();
        const points = 24;
        const angleStep = (Math.PI * 2) / points;

        for (let i = 0; i <= points; i++) {
            const angle = i * angleStep;
            
            // Harmonic organic noise deform
            const wave1 = Math.sin(angle * 3 + this.time * 1.8 + phaseOffset) * (9 + this.audioEnergy * 14);
            const wave2 = Math.cos(angle * 5 - this.time * 2.2 + phaseOffset) * (6 + this.audioEnergy * 10);
            const wave3 = Math.sin(angle * 2 + this.time * 0.9) * 5;

            const r = baseRadius + wave1 + wave2 + wave3;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();

        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, baseRadius * 1.3);
        const rgbStr = rgb.map(Math.round).join(",");
        grad.addColorStop(0, `rgba(255, 255, 255, ${0.4 * alpha})`);
        grad.addColorStop(0.35, `rgba(${rgbStr}, ${0.75 * alpha})`);
        grad.addColorStop(0.85, `rgba(${rgbStr}, ${0.25 * alpha})`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = grad;
        ctx.shadowBlur = 35 + this.audioEnergy * 30;
        ctx.shadowColor = `rgba(${rgbStr}, 0.8)`;
        ctx.fill();
    }

    drawSiriRibbons(ctx) {
        const ribbonWidth = 260;
        const waveAmp = 12 + this.audioEnergy * 45;
        const rgb1 = this.c1.map(Math.round).join(",");
        const rgb2 = this.c2.map(Math.round).join(",");

        ctx.lineWidth = 2.5;

        // Wave 1
        ctx.beginPath();
        for (let x = -ribbonWidth / 2; x <= ribbonWidth / 2; x += 4) {
            const envelope = Math.cos((x / (ribbonWidth / 2)) * (Math.PI / 2));
            const y = Math.sin((x * 0.04) + this.time * 3.5) * waveAmp * envelope;
            if (x === -ribbonWidth / 2) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${rgb1}, ${0.6 + this.audioEnergy * 0.4})`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgb(${rgb1})`;
        ctx.stroke();

        // Wave 2
        ctx.beginPath();
        for (let x = -ribbonWidth / 2; x <= ribbonWidth / 2; x += 4) {
            const envelope = Math.cos((x / (ribbonWidth / 2)) * (Math.PI / 2));
            const y = Math.sin((x * 0.035) - this.time * 2.8 + 1.2) * (waveAmp * 0.8) * envelope;
            if (x === -ribbonWidth / 2) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${rgb2}, ${0.5 + this.audioEnergy * 0.4})`;
        ctx.shadowBlur = 16;
        ctx.shadowColor = `rgb(${rgb2})`;
        ctx.stroke();
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.echoCore = new EchoLivingCore();
});
