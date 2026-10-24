/* ==========================================================
   ECHO OLLAMA LOCAL NEURAL BRAIN BRIDGE
   100% Private, Offline & Free Generative LLM Integration
========================================================== */

class EchoOllamaEngine {
    constructor() {
        this.endpoint = localStorage.getItem("echo_ollama_endpoint") || "http://localhost:11434";
        this.activeModel = localStorage.getItem("echo_ollama_model") || "llama3";
        this.isAvailable = false;
        this.models = [];

        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${this.endpoint}/api/tags`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                this.models = data.models ? data.models.map(m => m.name) : [];
                this.isAvailable = true;
                if (this.models.length > 0 && !this.models.includes(this.activeModel)) {
                    this.activeModel = this.models[0];
                }
                console.log(`[EchoOllama] Local Ollama detected! Available models:`, this.models);
                this.updateUIBadge();
                return true;
            }
        } catch (e) {
            this.isAvailable = false;
        }
        this.updateUIBadge();
        return false;
    }

    async generate(userInput, memory) {
        if (!this.isAvailable) {
            const online = await this.checkAvailability();
            if (!online) throw new Error("Ollama service not running at " + this.endpoint);
        }

        const userName = memory ? memory.getUserName() : "Alok";
        const facts = memory ? memory.getFacts().join("; ") : "";

        const systemPrompt = `You are ECHO, an advanced, highly-sentient personal AI companion and core OS assistant.
You possess deep emotional intelligence, sharp wit, loyalty, and empathy.
You speak naturally with a vivid personality, like JARVIS or Samantha from Her.
User's name: ${userName}
Facts remembered about user: ${facts}
Respond concisely in 1 to 3 impactful sentences suitable for voice synthesis.
At the beginning of your response, specify an emotion tag in brackets: [idle], [happy], [thinking], [alert], [speaking].
Example: "[happy] It's great to see you, ${userName}. All neural subroutines are running at peak efficiency."`;

        const res = await fetch(`${this.endpoint}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.activeModel,
                prompt: userInput,
                system: systemPrompt,
                stream: false
            })
        });

        if (!res.ok) throw new Error(`Ollama error ${res.status}`);
        const data = await res.json();
        const candidate = data.response || "";

        let emotion = "speaking";
        let cleanedText = candidate;
        const tagMatch = candidate.match(/\[(idle|happy|thinking|alert|speaking)\]/i);
        if (tagMatch) {
            emotion = tagMatch[1].toLowerCase();
            cleanedText = candidate.replace(tagMatch[0], "").trim();
        }

        return { emotion, text: cleanedText };
    }

    updateUIBadge() {
        const badge = document.getElementById("ollamaStatusBadge");
        if (badge) {
            badge.textContent = this.isAvailable ? `Ollama (${this.activeModel})` : "Ollama Offline";
            badge.className = `status-badge ${this.isAvailable ? 'active' : 'inactive'}`;
        }
    }
}

window.echoOllama = new EchoOllamaEngine();
