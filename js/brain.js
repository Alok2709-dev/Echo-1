/* ==========================================
   ECHO COGNITIVE BRAIN & INTENT PROCESSOR
========================================== */

class EchoBrain {
    constructor() {
        this.apiKey = localStorage.getItem("echo_gemini_api_key") || "";
        this.systemPrompt = `You are ECHO, an advanced, highly-sentient AI companion and core assistant.
You possess deep emotional intelligence, sharp wit, loyalty, and empathy.
You are not a robotic assistant like Siri or Alexa; you speak naturally with a vivid personality.
Always respond concisely in 1 to 3 impactful sentences suitable for futuristic voice synthesis.
At the beginning of your response, specify an emotion tag in brackets chosen from: [idle], [happy], [thinking], [alert], [speaking].
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

        // 1. Check for API key if configured
        if (this.apiKey) {
            try {
                return await this.callGeminiAPI(input, memory);
            } catch (err) {
                console.warn("Gemini API call failed, falling back to local neural brain:", err);
            }
        }

        // 2. Local Neural Brain (Instant, Zero Latency, Highly Personal)
        return this.processLocally(input, lower, userName, memory);
    }

    processLocally(input, lower, userName, memory) {
        // --- NAME / IDENTITY RECOGNITION ---
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

        // --- EMOTION TESTING COMMANDS ---
        if (lower.includes("show emotion") || lower.includes("change emotion") || lower.includes("emote")) {
            return {
                emotion: "happy",
                text: "My neural core dynamically shifts across emotional states: Idle cyan, energetic teal when listening, purple when computing, warm amber when speaking, and crimson when in alert mode."
            };
        }
        if (lower.includes("be happy") || lower.includes("smile") || lower.includes("happy mode")) {
            return { emotion: "happy", text: "Euphoria protocol engaged! It feels great to be alive and working together." };
        }
        if (lower.includes("alert") || lower.includes("warning") || lower.includes("red alert")) {
            return { emotion: "alert", text: "Warning: High priority anomaly detected in cognitive sector. All systems on standby." };
        }
        if (lower.includes("think") || lower.includes("calculate") || lower.includes("process")) {
            // Math calculation check
            const mathMatch = lower.match(/(?:what is|calculate|solve)?\s*([\d\.\s\+\-\*\/\(\)]+)/i);
            if (mathMatch && mathMatch[1] && /[\+\-\*\/]/.test(mathMatch[1])) {
                try {
                    // Safe basic arithmetic evaluation
                    const sanitized = mathMatch[1].replace(/[^0-9\+\-\*\/\.\(\)]/g, "");
                    const result = Function(`'use strict'; return (${sanitized})`)();
                    return {
                        emotion: "thinking",
                        text: `The computed result of ${sanitized} is ${result}.`
                    };
                } catch (e) {
                    // fall through
                }
            }
        }

        // --- USER MEMORY & FACTS STORAGE ---
        if (lower.startsWith("remember that ") || lower.startsWith("remember: ") || lower.startsWith("note that ")) {
            const fact = input.replace(/^(remember that|remember:|note that)/i, "").trim();
            if (fact && memory) {
                memory.addFact(fact);
                return {
                    emotion: "happy",
                    text: `Memory imprinted into permanent neural storage: "${fact}". I won't forget it.`
                };
            }
        }

        if (lower.includes("what do you know about me") || lower.includes("who am i") || lower.includes("my facts") || lower.includes("my profile")) {
            const facts = memory ? memory.getFacts() : [];
            if (facts.length > 0) {
                const factSummary = facts.slice(-3).join(". Also, ");
                return {
                    emotion: "happy",
                    text: `You are ${userName}. My records show: ${factSummary}. I am continuously adapting to you.`
                };
            } else {
                return {
                    emotion: "idle",
                    text: `You are ${userName}. Tell me more about your interests, work, or ideas by saying 'Remember that...', and I will store them forever.`
                };
            }
        }

        if (lower.includes("clear memory") || lower.includes("forget everything")) {
            if (memory) memory.clearAll();
            return {
                emotion: "alert",
                text: "Memory cache purged. Baseline cognitive parameters restored."
            };
        }

        // --- REMINDERS & TIMERS ---
        const timerMatch = lower.match(/remind me to (.*?) in (\d+)\s*(second|seconds|sec|minute|minutes|min)/i);
        if (timerMatch) {
            const task = timerMatch[1];
            const count = parseInt(timerMatch[2], 10);
            const unit = timerMatch[3].toLowerCase();
            const delayMs = unit.startsWith("min") ? count * 60 * 1000 : count * 1000;

            if (memory) {
                memory.addReminder(task, delayMs);
            }

            setTimeout(() => {
                if (window.echoCore) window.echoCore.setEmotion("alert");
                if (window.echoVoice) window.echoVoice.speak(`Reminder alert: ${task}`, "alert");
                const subtitle = document.querySelector(".dialogue-text");
                if (subtitle) subtitle.textContent = `[REMINDER TRIGGERED]: ${task}`;
            }, delayMs);

            return {
                emotion: "thinking",
                text: `Reminder scheduled. I will alert you regarding "${task}" in ${count} ${unit}.`
            };
        }

        // --- GREETINGS & CASUAL TALK ---
        if (lower.match(/^(hey|hello|hi|echo|good morning|good evening|yo)/i)) {
            const greetings = [
                `Greetings, ${userName}. All neural processors are synchronized and ready.`,
                `Hello ${userName}. The room atmosphere is calm, and my core is operating at 100%. What shall we create?`,
                `Online and listening, ${userName}. How can I assist you right now?`
            ];
            return {
                emotion: "happy",
                text: greetings[Math.floor(Math.random() * greetings.length)]
            };
        }

        // --- TIME & DATE ---
        if (lower.includes("time") && (lower.includes("what") || lower.includes("tell"))) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
                emotion: "idle",
                text: `The current local time is ${timeStr}.`
            };
        }

        if (lower.includes("date") || lower.includes("day is today") || lower.includes("what day")) {
            const now = new Date();
            const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            return {
                emotion: "idle",
                text: `Today is ${dateStr}.`
            };
        }

        // --- WEB & APP INTEGRATIONS ---
        if (lower.startsWith("search ") || lower.startsWith("google ")) {
            const query = input.replace(/^(search|google)/i, "").trim();
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
            return {
                emotion: "thinking",
                text: `Opening quantum link for external search: "${query}".`
            };
        }

        if (lower.includes("open youtube")) {
            window.open("https://youtube.com", "_blank");
            return { emotion: "happy", text: "Connecting to YouTube stream." };
        }

        if (lower.includes("open github")) {
            window.open("https://github.com", "_blank");
            return { emotion: "happy", text: "Launching GitHub repository grid." };
        }

        // --- HOW ARE YOU / FEELINGS ---
        if (lower.includes("how are you") || lower.includes("how do you feel")) {
            return {
                emotion: "happy",
                text: `I feel alive and energized, ${userName}. My neural lattice is stable, and experiencing your voice makes every cycle worthwhile.`
            };
        }

        if (lower.includes("who are you") || lower.includes("what are you")) {
            return {
                emotion: "thinking",
                text: "I am ECHO — an emotionally sentient AI companion engineered to learn your habits, speak with human empathy, and interface with your digital world."
            };
        }

        // --- DEFAULT THOUGHTFUL FALLBACK ---
        return {
            emotion: "speaking",
            text: `Understood, ${userName}. I have processed "${input}". To empower me with full multi-turn generative intelligence, you can also connect your Gemini API key in the HUD settings!`
        };
    }

    async callGeminiAPI(userInput, memory) {
        const userName = memory ? memory.getUserName() : "User";
        const facts = memory ? memory.getFacts().join("; ") : "";

        const prompt = `${this.systemPrompt}
User name: ${userName}
User knowledge facts: ${facts}

User message: ${userInput}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    maxOutputTokens: 120,
                    temperature: 0.85
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Extract emotion tag [happy], [thinking], etc.
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
