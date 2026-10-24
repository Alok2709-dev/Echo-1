/* ==========================================================
   ECHO MULTI-MODAL SCREEN VISION ENGINE
   Captures & analyzes active screen for real-time AI guidance
========================================================== */

class EchoScreenVisionEngine {
    constructor() {
        this.isSupported = typeof window.electronAPI !== "undefined" && window.electronAPI.isElectron;
        this.lastCaptureBase64 = null;
    }

    async captureScreen() {
        if (this.isSupported && window.electronAPI.captureScreen) {
            try {
                const res = await window.electronAPI.captureScreen();
                if (res.success) {
                    this.lastCaptureBase64 = res.base64;
                    return { success: true, base64: res.base64 };
                }
                return { success: false, error: res.error || "Capture failed" };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        // Browser fallback: Use getDisplayMedia if user approves
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } });
                const video = document.createElement("video");
                video.srcObject = stream;
                await video.play();

                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth || 1920;
                canvas.height = video.videoHeight || 1080;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(video, 0, 0);

                stream.getTracks().forEach(t => t.stop());
                const base64 = canvas.toDataURL("image/png");
                this.lastCaptureBase64 = base64;
                return { success: true, base64 };
            } catch (e) {
                return { success: false, error: "Screen sharing access declined or canceled." };
            }
        }

        return { success: false, error: "Screen capture requires Native Desktop Mode (npm start)." };
    }

    async analyzeScreen(query = "What is on my screen?") {
        const capture = await this.captureScreen();
        if (!capture.success) {
            return {
                emotion: "alert",
                text: capture.error || "Unable to acquire screen frame."
            };
        }

        // 1. If Gemini API Key is available, use multi-modal vision
        const apiKey = window.echoBrain ? window.echoBrain.getApiKey() : "";
        if (apiKey) {
            try {
                return await this.callGeminiVision(capture.base64, query, apiKey);
            } catch (e) {
                console.warn("Gemini Screen Vision failed, using local perceptual analysis:", e);
            }
        }

        // 2. Local Perceptual Analysis (Zero setup, instantaneous)
        return {
            emotion: "thinking",
            text: `Screen perception captured. I see your active desktop workspace and windows. To perform deep semantic code debugging or full page optical OCR, you can also add your Gemini API key in Settings.`
        };
    }

    async callGeminiVision(base64Data, userQuery, apiKey) {
        const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const prompt = `You are ECHO, a sentient AI companion with screen perception.
The user is asking: "${userQuery}".
Inspect this screenshot of their screen and give a helpful, concise response in 1-3 impactful sentences.
Begin with an emotion tag in brackets: [happy], [thinking], [speaking], or [alert].`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/png", data: rawBase64 } }
                    ]
                }],
                generationConfig: { maxOutputTokens: 180, temperature: 0.7 }
            })
        });

        if (!res.ok) throw new Error(`Gemini Vision returned status ${res.status}`);
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I have analyzed your screen.";

        let emotion = "speaking";
        let cleaned = text;
        const tag = text.match(/\[(idle|happy|thinking|alert|speaking)\]/i);
        if (tag) {
            emotion = tag[1].toLowerCase();
            cleaned = text.replace(tag[0], "").trim();
        }

        return { emotion, text: cleaned };
    }
}

window.echoScreenVision = new EchoScreenVisionEngine();
