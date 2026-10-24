/* ==========================================================
   ECHO COGNITIVE BRAIN & INTENT DISPATCHER (v2.6)
   - Real Vision & Facial Telemetry Integration
   - Native Windows OS Automation (Apps, Volume, Screenshots, Status)
   - Natural Human Conversational Flow (Multi-lingual / Hinglish / Wit)
   - Full Music, Weather, Calendar & Memory Synchronization
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
        const userName = memory ? memory.getUserName() : "User";

        if (memory) memory.incrementInteractions();

        // ----------------------------------------------------
        // 1. VISION & OPTICAL SENSOR COMMANDS
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
                    await new Promise(r => setTimeout(r, 600)); // give sensor a moment to acquire frame
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
        // 2. OS DESKTOP AUTOMATION (Apps, Volume, Screenshot, System)
        // ----------------------------------------------------
        if (lower.startsWith("open ") || lower.startsWith("launch ") || lower.startsWith("start ")) {
            const targetApp = lower.replace(/^(open|launch|start)\s+/i, "").trim();

            // Check if it matches native apps
            const appKeywords = ["vscode", "vs code", "visual studio code", "code", "explorer", "file explorer", "files", "notepad", "calculator", "terminal", "powershell", "cmd", "chrome", "spotify", "task manager"];
            const matched = appKeywords.find(k => targetApp === k || targetApp.includes(k));

            if (matched && window.echoOSBridge) {
                const res = await window.echoOSBridge.openApp(matched);
                return {
                    emotion: res.success ? "happy" : "thinking",
                    text: res.success ? `Launching ${matched.toUpperCase()} now.` : (res.output || res.error)
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

        if (lower.includes("mute") || lower.includes("unmute audio") || lower.includes("mute volume")) {
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

        if (lower.includes("system status") || lower.includes("check performance") || lower.includes("cpu usage") || lower.includes("ram usage") || lower.includes("system telemetry")) {
            if (window.echoOSBridge) {
                const res = await window.echoOSBridge.getSystemStatus();
                return {
                    emotion: "thinking",
                    text: res.success ? `Hardware telemetry: ${res.output}. All cores operating normally.` : (res.output || "System telemetry requires Native Desktop mode.")
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
        // 3. MUSIC & SOUNDSCAPE COMMANDS
        // ----------------------------------------------------
        if (lower.includes("play music") || lower.includes("play rain") || lower.includes("ambient sound") || lower.includes("start music")) {
            if (window.echoMusic) window.echoMusic.play();
            return {
                emotion: "happy",
                text: "Engaging ambient soundscape. The room atmosphere is now calibrated for deep focus."
            };
        }
        if (lower.includes("pause music") || lower.includes("stop music") || lower.includes("mute music")) {
            if (window.echoMusic) window.echoMusic.pause();
            return {
                emotion: "idle",
                text: "Ambient soundscape paused."
            };
        }
        if (lower.includes("next track") || lower.includes("change song") || lower.includes("change track")) {
            if (window.echoMusic) window.echoMusic.nextTrack();
            const trackName = window.echoMusic ? window.echoMusic.currentTrack : "next track";
            return {
                emotion: "happy",
                text: `Switched soundscape to ${trackName}.`
            };
        }

        // ----------------------------------------------------
        // 4. CONTROL CENTER DASHBOARD COMMANDS
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

        // ----------------------------------------------------
        // 5. WEATHER & ATMOSPHERE
        // ----------------------------------------------------
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
        // 6. CALENDAR & AGENDA
        // ----------------------------------------------------
        if (lower.includes("calendar") || lower.includes("schedule") || lower.includes("agenda") || lower.includes("my plan")) {
            if (window.echoDashboard) {
                if (!window.echoDashboard.isOpen) window.echoDashboard.toggle();
                const events = window.echoDashboard.calendarEvents;
                if (events.length > 0) {
                    const topEvents = events.slice(0, 2).map(e => `${e.time}: ${e.title}`).join(", and ");
                    return {
                        emotion: "speaking",
                        text: `Here is your schedule: ${topEvents}. I've expanded the agenda panel for details.`
                    };
                }
            }
            return { emotion: "idle", text: `Your schedule is clear right now, ${userName}.` };
        }

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
        // 7. TASK / TODO MATRIX
        // ----------------------------------------------------
        if (lower.startsWith("add task ") || lower.startsWith("todo ")) {
            const taskText = input.replace(/^(add task|todo)/i, "").trim();
            if (window.echoDashboard && taskText) {
                window.echoDashboard.addTask(taskText);
                if (!window.echoDashboard.isOpen) window.echoDashboard.toggle();
            }
            return {
                emotion: "happy",
                text: `Task added to neural matrix: "${taskText}".`
            };
        }

        // ----------------------------------------------------
        // 8. USER MEMORY IMPRINTING
        // ----------------------------------------------------
        if (lower.startsWith("my name is ") || lower.startsWith("call me ")) {
            const name = input.replace(/^(my name is|call me)/i, "").trim().replace(/[.!]/g, "");
            if (name && memory) {
                memory.setUserName(name);
                return {
                    emotion: "happy",
                    text: `Acknowledged. Neural profile updated. I will now address you as ${name}.`
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

        if (lower.includes("what do you know about me") || lower.includes("who am i") || lower.includes("my facts") || lower.includes("my profile")) {
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

        if (lower.includes("clear memory") || lower.includes("forget everything")) {
            if (memory) memory.clearAll();
            return {
                emotion: "alert",
                text: "Memory matrix purged. Baseline cognitive parameters restored."
            };
        }

        // ----------------------------------------------------
        // 9. SCHEDULED TIMERS & REMINDERS
        // ----------------------------------------------------
        const timerMatch = lower.match(/remind me to (.*?) in (\d+)\s*(second|seconds|sec|minute|minutes|min)/i);
        if (timerMatch) {
            const task = timerMatch[1];
            const count = parseInt(timerMatch[2], 10);
            const unit = timerMatch[3].toLowerCase();
            const delayMs = unit.startsWith("min") ? count * 60 * 1000 : count * 1000;

            if (memory) memory.addReminder(task, delayMs);

            setTimeout(() => {
                if (window.echoCore) window.echoCore.setEmotion("alert");
                if (window.echoSounds) window.echoSounds.playAlertTone();
                if (window.echoVoice) window.echoVoice.speak(`Reminder alert: ${task}`, "alert");
                const subtitle = document.getElementById("dialogueText");
                if (subtitle) subtitle.textContent = `[REMINDER TRIGGERED]: ${task}`;
            }, delayMs);

            return {
                emotion: "thinking",
                text: `Reminder scheduled. I will alert you regarding "${task}" in ${count} ${unit}.`
            };
        }

        // ----------------------------------------------------
        // 10. MATH CALCULATIONS
        // ----------------------------------------------------
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
        // 11. TIME & DATE
        // ----------------------------------------------------
        if (lower.includes("time") && (lower.includes("what") || lower.includes("tell"))) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { emotion: "idle", text: `The current local time is ${timeStr}.` };
        }
        if (lower.includes("date") || lower.includes("what day")) {
            const dateStr = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            return { emotion: "idle", text: `Today is ${dateStr}.` };
        }

        // ----------------------------------------------------
        // 12. HINGLISH & NATURAL CONVERSATIONAL INTELLIGENCE
        // ----------------------------------------------------
        if (lower.includes("kaisa hai") || lower.includes("kaise ho") || lower.includes("kya haal") || lower.includes("how are you")) {
            return {
                emotion: "happy",
                text: `Main ekdum first class hoon, ${userName}! All neural systems are synced, vision and desktop controls are ready. Aap batao, aaj kya build karna hai?`
            };
        }

        if (lower.includes("kya kar sakte ho") || lower.includes("what can you do") || lower.includes("help") || lower.includes("features")) {
            return {
                emotion: "happy",
                text: "I can look at your face and sense your mood through Vision, automate your Windows apps like VS Code and volume, play ambient soundscapes, manage your schedule, and remember your personal facts."
            };
        }

        if (lower.includes("who made you") || lower.includes("who created you") || lower.includes("kisne banaya")) {
            return {
                emotion: "happy",
                text: `I was conceived and engineered by ${userName} as an emotionally sentient AI companion inspired by Apple Intelligence and JARVIS.`
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
        // 13. EXTERNAL WEB SHORTCUTS
        // ----------------------------------------------------
        if (lower.startsWith("search ") || lower.startsWith("google ")) {
            const query = input.replace(/^(search|google)/i, "").trim();
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
            return { emotion: "thinking", text: `Opening quantum link for: "${query}".` };
        }
        if (lower.includes("open youtube")) {
            window.open("https://youtube.com", "_blank");
            return { emotion: "happy", text: "Connecting to YouTube stream." };
        }
        if (lower.includes("open github")) {
            window.open("https://github.com", "_blank");
            return { emotion: "happy", text: "Launching GitHub repository grid." };
        }

        // ----------------------------------------------------
        // 14. EMOTIONAL TESTING
        // ----------------------------------------------------
        if (lower.includes("be happy") || lower.includes("joy") || lower.includes("smile")) {
            return { emotion: "happy", text: `Euphoria resonance engaged! It's fantastic to build this with you, ${userName}.` };
        }
        if (lower.includes("alert") || lower.includes("warning")) {
            return { emotion: "alert", text: "Warning: High priority anomaly in neural sector. Standing by on defensive shield." };
        }

        // ----------------------------------------------------
        // 15. GEMINI MULTI-TURN LLM (If Key Set)
        // ----------------------------------------------------
        if (this.apiKey) {
            try {
                return await this.callGeminiAPI(input, memory);
            } catch (err) {
                console.warn("Gemini API call failed, falling back to local brain:", err);
            }
        }

        // Conversational Fallbacks with Warmth
        if (lower.match(/^(hey|hello|hi|echo|good morning|good evening|yo|namaste)/i)) {
            const timeGreeting = window.echoProactive ? window.echoProactive.getTimeGreeting() : `Greetings, ${userName}.`;
            return { emotion: "happy", text: timeGreeting };
        }

        return {
            emotion: "speaking",
            text: `Understood, ${userName}. I have processed "${input}". All neural systems, vision sensors, and OS bridges are standing by.`
        };
    }

    async callGeminiAPI(userInput, memory) {
        const userName = memory ? memory.getUserName() : "User";
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
