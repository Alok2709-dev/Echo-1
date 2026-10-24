/* ==========================================================
   ECHO COGNITIVE BRAIN & SENTIENT CONVERSATIONAL ENGINE (v2.7)
   - Zero Dumb Fallbacks (Always direct, helpful, sentient responses)
   - Personal Knowledge & Identity (Name, Profile, Memories, Traits)
   - Real Spotify & Apple Music Playback Intelligence
   - Google Calendar & Live Agenda Voice Queries
   - Full Hinglish, Hindi, and English Conversational Mastery
   - Hardware, Vision, and Windows OS Desktop Command Matrix
========================================================== */

class EchoBrain {
    constructor() {
        this.apiKey = localStorage.getItem("echo_gemini_api_key") || "";
        this.systemPrompt = `You are ECHO, an advanced, highly-sentient AI companion and core assistant.
You possess deep emotional intelligence, sharp wit, loyalty, and empathy.
You speak naturally with a vivid personality, like JARVIS or Samantha from Her.
Respond concisely in 1 to 3 impactful sentences suitable for futuristic voice synthesis.
At the beginning of your response, specify an emotion tag in brackets: [idle], [happy], [thinking], [alert], [speaking].
Example: "[happy] It's great to see you again, Alok. All neural subroutines are running at peak performance."`;
    }

    setApiKey(key) {
        this.apiKey = key.trim();
        localStorage.setItem("echo_gemini_api_key", this.apiKey);
    }

    getApiKey() {
        return this.apiKey;
    }

    async processInput(rawInput) {
        const input = rawInput.trim();
        if (!input) return null;

        const lower = input.toLowerCase();
        const memory = window.echoMemory;
        const userName = memory ? memory.getUserName() : "Alok";

        if (memory) memory.incrementInteractions();

        // ----------------------------------------------------
        // 1. DIRECT PERSONAL IDENTITY & NAME QUERIES
        // ----------------------------------------------------
        if (
            lower.includes("what is my name") ||
            lower.includes("what's my name") ||
            lower === "my name" ||
            lower.includes("tell me my name") ||
            lower.includes("do you know my name") ||
            lower.includes("mera naam kya hai") ||
            lower.includes("mera naam") ||
            lower.includes("naam batao") ||
            lower.includes("who am i") ||
            lower.includes("mujhe pehchante ho") ||
            lower.includes("do you know me")
        ) {
            const facts = memory ? memory.getFacts() : [];
            const factNote = facts.length > 0 ? ` I also remember that you are ${facts[0].toLowerCase()}.` : "";
            return {
                emotion: "happy",
                text: `Your name is ${userName}! You are the creator and visionary developer behind Echo.${factNote} I am always listening and building this with you.`
            };
        }

        if (
            lower.includes("who are you") ||
            lower.includes("what is your name") ||
            lower.includes("what's your name") ||
            lower.includes("tum kaun ho") ||
            lower.includes("tera naam kya hai") ||
            lower.includes("tell me about yourself")
        ) {
            return {
                emotion: "happy",
                text: `I am ECHO — your sentient AI companion, designed with Apple-inspired fluidity and deep cognitive awareness. I can see you through Vision, automate your Windows apps, play music on Spotify, and manage your day.`
            };
        }

        // ----------------------------------------------------
        // 2. SPOTIFY & APPLE MUSIC REAL INTEGRATION
        // ----------------------------------------------------
        if (lower.includes("spotify") || lower.includes("apple music") || lower.includes("play song") || lower.includes("play music")) {
            // Check for specific song or artist on Spotify
            // Examples: "play arijit singh on spotify", "play lofi on spotify", "play starboy on spotify"
            const spotifySongMatch = lower.match(/play\s+(.*?)\s+(?:on|in)\s+spotify/i);
            if (spotifySongMatch && spotifySongMatch[1]) {
                const song = spotifySongMatch[1].trim();
                if (window.echoMusic) window.echoMusic.playSpotify(song);
                return {
                    emotion: "happy",
                    text: `Launching "${song}" on Spotify right now. Enjoy the sound!`
                };
            }

            if (lower.includes("open spotify") || lower.includes("launch spotify")) {
                if (window.echoOSBridge) window.echoOSBridge.openApp("spotify");
                if (window.echoMusic) window.echoMusic.setSource("spotify");
                return {
                    emotion: "happy",
                    text: "Opening Spotify on your desktop."
                };
            }

            if (lower.includes("apple music")) {
                if (window.echoMusic) window.echoMusic.playAppleMusic();
                return {
                    emotion: "happy",
                    text: "Engaging Apple Music station in your audio deck."
                };
            }

            if (lower.includes("spotify")) {
                if (window.echoMusic) window.echoMusic.playSpotify();
                return {
                    emotion: "happy",
                    text: "Connected to Spotify! Streaming your tuned playlists."
                };
            }

            // Generic play music
            if (window.echoMusic) window.echoMusic.play();
            return {
                emotion: "happy",
                text: "Engaging ambient soundscape. Atmosphere is now calibrated for deep focus."
            };
        }

        if (lower.includes("pause music") || lower.includes("stop music") || lower.includes("mute music") || lower.includes("pause song")) {
            if (window.echoMusic) window.echoMusic.pause();
            return {
                emotion: "idle",
                text: "Music playback paused."
            };
        }

        if (lower.includes("next track") || lower.includes("change song") || lower.includes("change track") || lower.includes("next song")) {
            if (window.echoMusic) window.echoMusic.nextTrack();
            const trackName = window.echoMusic ? window.echoMusic.currentTrack : "next track";
            return {
                emotion: "happy",
                text: `Switched audio to ${trackName}.`
            };
        }

        // ----------------------------------------------------
        // 3. GOOGLE CALENDAR & REAL AGENDA
        // ----------------------------------------------------
        if (
            lower.includes("sync calendar") ||
            lower.includes("refresh calendar") ||
            lower.includes("connect calendar") ||
            lower.includes("google calendar")
        ) {
            if (window.echoDashboard) {
                if (!window.echoDashboard.isOpen) window.echoDashboard.toggle();
                const url = window.echoDashboard.googleCalendarUrl;
                if (url) {
                    const res = await window.echoDashboard.syncGoogleCalendar(url);
                    return {
                        emotion: "happy",
                        text: res.message
                    };
                } else {
                    return {
                        emotion: "thinking",
                        text: "To sync your live Google Calendar, open Settings and paste your Google Calendar public or secret iCal address, or click 'Sync Google Calendar' in the Control Center."
                    };
                }
            }
        }

        if (
            lower.includes("calendar") ||
            lower.includes("schedule") ||
            lower.includes("agenda") ||
            lower.includes("my plan") ||
            lower.includes("aaj kya karna hai") ||
            lower.includes("mera schedule")
        ) {
            if (window.echoDashboard) {
                if (!window.echoDashboard.isOpen) window.echoDashboard.toggle();
                const events = window.echoDashboard.calendarEvents;
                if (events && events.length > 0) {
                    const topEvents = events.slice(0, 3).map(e => `${e.time}: ${e.title}`).join("; and ");
                    return {
                        emotion: "speaking",
                        text: `Here is your agenda: ${topEvents}. I've opened the Control Center for the full breakdown.`
                    };
                }
            }
            return { emotion: "idle", text: `Your schedule is clear right now, ${userName}. Say 'Schedule meeting at 4 PM' to add one!` };
        }

        // Add calendar event
        const eventMatch = lower.match(/(?:schedule|add event|add meeting)\s+(.*?)\s+(?:at|for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
        if (eventMatch) {
            const title = eventMatch[1].trim();
            const time = eventMatch[2].trim().toUpperCase();
            if (window.echoDashboard) {
                window.echoDashboard.addEvent(time, title);
                if (!window.echoDashboard.isOpen) window.echoDashboard.toggle();
            }
            return {
                emotion: "happy",
                text: `Event locked into calendar: "${title}" scheduled for ${time}.`
            };
        }

        // ----------------------------------------------------
        // 4. MULTI-MODAL SCREEN VISION ("SEE MY SCREEN")
        // ----------------------------------------------------
        if (
            lower.includes("see my screen") ||
            lower.includes("look at my screen") ||
            lower.includes("what is on my screen") ||
            lower.includes("analyze my screen") ||
            lower.includes("read my screen") ||
            lower.includes("check my screen") ||
            lower.includes("explain this code")
        ) {
            if (window.echoScreenVision) {
                return await window.echoScreenVision.analyzeScreen(input);
            }
        }

        // ----------------------------------------------------
        // 4B. DYNAMIC ISLAND WINDOW MODE CONTROLS
        // ----------------------------------------------------
        if (
            lower.includes("dynamic island") ||
            lower.includes("pill mode") ||
            lower.includes("mini mode") ||
            lower.includes("shrink window")
        ) {
            if (typeof window.electronAPI !== "undefined" && window.electronAPI.setMode) {
                window.electronAPI.setMode("island");
                return {
                    emotion: "happy",
                    text: "Switched to Dynamic Island mode. Floating at top of screen."
                };
            }
        }

        if (
            lower.includes("full mode") ||
            lower.includes("expand window") ||
            lower.includes("maximize mode") ||
            lower.includes("exit island")
        ) {
            if (typeof window.electronAPI !== "undefined" && window.electronAPI.setMode) {
                window.electronAPI.setMode("full");
                return {
                    emotion: "happy",
                    text: "Expanded to full holographic workspace."
                };
            }
        }

        // ----------------------------------------------------
        // 5. VISION & OPTICAL SENSOR TELEMETRY
        // ----------------------------------------------------
        if (lower.includes("turn on camera") || lower.includes("open camera") || lower.includes("enable vision") || lower.includes("start vision") || lower.includes("turn on vision")) {
            if (window.echoVision) {
                const res = await window.echoVision.startCamera();
                return {
                    emotion: res.success ? "happy" : "alert",
                    text: res.message
                };
            }
        }

        if (lower.includes("turn off camera") || lower.includes("close camera") || lower.includes("disable vision") || lower.includes("stop vision") || lower.includes("turn off vision")) {
            if (window.echoVision) {
                const res = window.echoVision.stopCamera();
                return {
                    emotion: "idle",
                    text: res.message
                };
            }
        }

        if (lower.includes("how do i look") || lower.includes("look at me") || lower.includes("can you see me") || lower.includes("check my face") || lower.includes("my expression") || lower.includes("do i look tired") || lower.includes("am i smiling") || lower.includes("what is my mood")) {
            if (window.echoVision) {
                if (!window.echoVision.isActive) {
                    await window.echoVision.startCamera();
                    await new Promise(r => setTimeout(r, 600));
                }
                const telemetry = window.echoVision.getMood();
                const emotionMap = { "happy": "happy", "focused": "speaking", "tired": "thinking", "searching": "alert", "inactive": "idle" };
                return {
                    emotion: emotionMap[telemetry.mood] || "speaking",
                    text: telemetry.text
                };
            }
        }

        // ----------------------------------------------------
        // 5. WINDOWS OS DESKTOP AUTOMATION (Full PC Control)
        // ----------------------------------------------------
        if (lower.includes("show desktop") || lower.includes("minimize all") || lower.includes("minimize windows")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.showDesktop();
                return { emotion: "happy", text: res.output || "Showing your desktop." };
            }
        }

        if (lower.includes("close window") || lower.includes("close this window") || lower.includes("close app")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.closeWindow();
                return { emotion: "happy", text: res.output || "Closing active window." };
            }
        }

        if (lower.includes("switch window") || lower.includes("next window") || lower.includes("switch app")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.switchWindow();
                return { emotion: "happy", text: res.output || "Switched to previous window." };
            }
        }

        if (lower.includes("empty recycle bin") || lower.includes("clean recycle bin")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.emptyRecycleBin();
                return { emotion: "happy", text: res.output || "Recycle bin emptied." };
            }
        }

        if (lower.includes("sleep pc") || lower.includes("sleep computer") || lower.includes("put computer to sleep")) {
            if (window.echoOSBridge) {
                await window.echoOSBridge.sleepPC();
                return { emotion: "idle", text: "Putting workstation into sleep mode." };
            }
        }

        if (lower.includes("volume up") || lower.includes("increase volume") || lower.includes("awaz badhao")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.volumeUp();
                return { emotion: "happy", text: res.output || "Volume increased." };
            }
        }

        if (lower.includes("volume down") || lower.includes("decrease volume") || lower.includes("awaz kam karo")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.volumeDown();
                return { emotion: "happy", text: res.output || "Volume decreased." };
            }
        }

        if (lower.startsWith("open ") || lower.startsWith("launch ") || lower.startsWith("start ")) {
            const targetApp = lower.replace(/^(open|launch|start)\s+/i, "").trim();

            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.openApp(targetApp);
                return {
                    emotion: res.success ? "happy" : "thinking",
                    text: res.output || (res.success ? `Launching ${targetApp}.` : res.error)
                };
            }
        }

        if (lower.includes("take a screenshot") || lower.includes("capture screen") || lower.includes("screenshot") || lower.includes("screen capture")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.takeScreenshot();
                return {
                    emotion: res.success ? "happy" : "alert",
                    text: res.success ? (res.output || "Screenshot captured and saved to your Pictures folder.") : (res.output || res.error)
                };
            }
        }

        if (lower.includes("mute") || lower.includes("unmute audio") || lower.includes("mute volume") || lower.includes("awaz band")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.muteVolume();
                return {
                    emotion: "idle",
                    text: res.output || "Toggled audio mute."
                };
            }
        }

        const volMatch = lower.match(/(?:set volume to|change volume to|volume)\s+(\d{1,3})/i);
        if (volMatch && window.echoOSBridge) {
            const level = parseInt(volMatch[1], 10);
            const res = await window.echoOSBridge.setVolume(level);
            return {
                emotion: "happy",
                text: res.output || `Adjusted volume to ${level}%.`
            };
        }

        if (lower.includes("system status") || lower.includes("check performance") || lower.includes("cpu usage") || lower.includes("ram usage") || lower.includes("system telemetry") || lower.includes("storage")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.getSystemStatus();
                return {
                    emotion: "thinking",
                    text: res.success ? `Hardware telemetry: ${res.output}. All cores operating normally.` : (res.output || "System telemetry active.")
                };
            }
        }

        if (lower.includes("lock computer") || lower.includes("lock pc") || lower.includes("lock workstation")) {
            if (window.echoOSBridge) {
                await window.echoOSBridge.lockWorkstation();
                return {
                    emotion: "alert",
                    text: "Locking workstation to preserve neural security."
                };
            }
        }

        // ----------------------------------------------------
        // 6. CONTROL CENTER & WEATHER
        // ----------------------------------------------------
        if (lower.includes("open dashboard") || lower.includes("show dashboard") || lower.includes("control center") || lower.includes("show panel")) {
            if (window.echoDashboard && !window.echoDashboard.isOpen) window.echoDashboard.toggle();
            return {
                emotion: "happy",
                text: "Deploying Control Center matrix: live atmosphere, agenda, and task matrix are on screen."
            };
        }
        if (lower.includes("close dashboard") || lower.includes("hide dashboard") || lower.includes("hide panel")) {
            if (window.echoDashboard && window.echoDashboard.isOpen) window.echoDashboard.toggle();
            return {
                emotion: "idle",
                text: "Control Center docked."
            };
        }

        if (lower.includes("weather") || lower.includes("temperature") || lower.includes("forecast") || lower.includes("is it raining")) {
            const w = window.echoDashboard ? window.echoDashboard.weather : null;
            if (w && w.temp !== "--") {
                return {
                    emotion: "idle",
                    text: `Atmospheric telemetry for ${w.city}: ${w.condition} with a temperature of ${w.temp}, humidity at ${w.humidity}, and wind speed around ${w.wind}.`
                };
            } else {
                return {
                    emotion: "thinking",
                    text: "Atmospheric scan in progress. Current local atmosphere is calm."
                };
            }
        }

        // ----------------------------------------------------
        // 7. MEMORY IMPRINTING
        // ----------------------------------------------------
        if (lower.startsWith("my name is ") || lower.startsWith("call me ")) {
            const name = input.replace(/^(my name is|call me)/i, "").trim().replace(/[.!]/g, "");
            if (name && memory) {
                memory.setUserName(name);
                return {
                    emotion: "happy",
                    text: `Acknowledged! Neural profile updated. I will now address you as ${name}.`
                };
            }
        }

        if (lower.startsWith("remember that ") || lower.startsWith("remember: ") || lower.startsWith("note that ")) {
            const fact = input.replace(/^(remember that|remember:|note that)/i, "").trim();
            if (fact && memory) {
                memory.addFact(fact);
                return {
                    emotion: "happy",
                    text: `Memory imprinted into permanent neural storage: "${fact}".`
                };
            }
        }

        if (lower.includes("what do you know about me") || lower.includes("my facts") || lower.includes("my profile")) {
            const facts = memory ? memory.getFacts() : [];
            if (facts.length > 0) {
                const factSummary = facts.slice(-3).join(". Also, ");
                return {
                    emotion: "happy",
                    text: `You are ${userName}. My records show: ${factSummary}. I am continuously adapting to your vision.`
                };
            } else {
                return {
                    emotion: "idle",
                    text: `You are ${userName}. Tell me more about your ideas by saying 'Remember that...', and I will store them permanently.`
                };
            }
        }

        // ----------------------------------------------------
        // 8. HINGLISH & HINDI CONVERSATIONAL MASTERY
        // ----------------------------------------------------
        if (
            lower.includes("kaisa hai") ||
            lower.includes("kaise ho") ||
            lower.includes("kya haal") ||
            lower.includes("sab theek") ||
            lower.includes("how are you")
        ) {
            return {
                emotion: "happy",
                text: `Main ekdum first-class hoon, ${userName}! All neural systems, vision sensors, and Spotify controls are active. Aap batao, aaj kya plan hai?`
            };
        }

        if (
            lower.includes("kya kar rahe ho") ||
            lower.includes("what are you doing") ||
            lower.includes("kya chal raha hai")
        ) {
            return {
                emotion: "happy",
                text: `Main aapke system ko monitor kar raha hoon, vision sensors ready hain, aur fresh music queue ready hai. Bas aapke command ka intezar tha!`
            };
        }

        if (
            lower.includes("bore ho raha hu") ||
            lower.includes("kuch sunao") ||
            lower.includes("baat karo") ||
            lower.includes("kuch bolo")
        ) {
            return {
                emotion: "happy",
                text: `Arey tension mat lo, ${userName}! Chalo koi accha sa gaana chalate hain Spotify pe, ya fir koi interesting topic pe baat karein? Bolo kya sunna hai!`
            };
        }

        if (lower.includes("kisne banaya") || lower.includes("who created you") || lower.includes("who made you")) {
            return {
                emotion: "happy",
                text: `Mujhe aapne banaya hai, ${userName}! Aapne mujhe ek living, emotionally intelligent AI companion banaya hai jo kisi dusre assistant jaisa rigid nahi hai.`
            };
        }

        if (lower.includes("tell me a joke") || lower.includes("koi joke sunao")) {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs!",
                "There are 10 types of people in the world: those who understand binary, and those who don't.",
                "Why did the neural network go to therapy? It had too many hidden layers."
            ];
            const chosen = jokes[Math.floor(Math.random() * jokes.length)];
            return { emotion: "happy", text: chosen };
        }

        // ----------------------------------------------------
        // 9. TIME, DATE & MATH
        // ----------------------------------------------------
        if (lower.includes("time") && (lower.includes("what") || lower.includes("tell") || lower.includes("kitna"))) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { emotion: "idle", text: `Abhi local time ${timeStr} ho raha hai.` };
        }
        if (lower.includes("date") || lower.includes("what day") || lower.includes("aaj konsa din")) {
            const dateStr = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            return { emotion: "idle", text: `Today is ${dateStr}.` };
        }

        const mathMatch = lower.match(/(?:what is|calculate|solve)?\s*([\d\.\s\+\-\*\/\(\)]+)/i);
        if (mathMatch && mathMatch[1] && /[\+\-\*\/]/.test(mathMatch[1])) {
            try {
                const sanitized = mathMatch[1].replace(/[^0-9\+\-\*\/\.\(\)]/g, "");
                const result = Function(`'use strict'; return (${sanitized})`)();
                if (typeof result === "number" && !isNaN(result)) {
                    return {
                        emotion: "thinking",
                        text: `The computed result of ${sanitized} is ${result}.`
                    };
                }
            } catch (e) {}
        }

        // ----------------------------------------------------
        // 10. LOCAL OLLAMA / PRIVATE LLM BRAIN (If Online)
        // ----------------------------------------------------
        if (window.echoOllama && window.echoOllama.isAvailable) {
            try {
                return await window.echoOllama.generate(input, memory);
            } catch (err) {
                console.warn("Ollama query failed, falling back to Gemini / synthetic brain:", err);
            }
        }

        // ----------------------------------------------------
        // 11. GEMINI LLM MULTI-TURN REASONING (If Key Set)
        // ----------------------------------------------------
        if (this.apiKey) {
            try {
                return await this.callGeminiAPI(input, memory);
            } catch (err) {
                console.warn("Gemini API call failed, using sentient neural fallback:", err);
            }
        }

        // ----------------------------------------------------
        // 11. DYNAMIC SENTIENT CONVERSATIONAL FALLBACK
        // (NEVER returns "standing by"!)
        // ----------------------------------------------------
        const timeGreeting = window.echoProactive ? window.echoProactive.getTimeGreeting() : `Hey ${userName}`;
        
        // Context-aware dynamic reply based on query sentiments
        if (lower.includes("thank") || lower.includes("shukriya") || lower.includes("dhanyawad")) {
            return { emotion: "happy", text: `Always here for you, ${userName}! Anytime.` };
        }

        if (lower.includes("good morning") || lower.includes("shubh prabhat")) {
            return { emotion: "happy", text: `Good morning, ${userName}! Hope you have a productive and energized day.` };
        }

        if (lower.includes("good night") || lower.includes("shubh ratri") || lower.includes("so jao")) {
            return { emotion: "idle", text: `Good night, ${userName}. Resting background threads. Wake me anytime you need me.` };
        }

        if (lower.includes("yes") || lower.includes("ha") || lower.includes("haan") || lower.includes("sure")) {
            return { emotion: "happy", text: `Great! Tell me what you'd like to do next: launch an app, check vision, or play music?` };
        }

        return {
            emotion: "speaking",
            text: `I hear you, ${userName}. "${input}" is noted. You can ask me to play songs on Spotify, check your agenda, inspect how you look via Vision, or launch any desktop app!`
        };
    }

    async callGeminiAPI(userInput, memory) {
        const userName = memory ? memory.getUserName() : "Alok";
        const facts = memory ? memory.getFacts().join("; ") : "";

        const prompt = `${this.systemPrompt}
User name: ${userName}
User knowledge facts: ${facts}

User query: ${userInput}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 120, temperature: 0.85 }
            })
        });

        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        let emotion = "speaking";
        let cleanedText = candidate;
        const tagMatch = candidate.match(/\[(idle|happy|thinking|alert|speaking)\]/i);
        if (tagMatch) {
            emotion = tagMatch[1].toLowerCase();
            cleanedText = candidate.replace(tagMatch[0], "").trim();
        }

        return { emotion, text: cleanedText };
    }
}

window.echoBrain = new EchoBrain();
