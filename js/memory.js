/* ==========================================
   ECHO MEMORY & USER KNOWLEDGE ENGINE
========================================== */

class EchoMemory {
    constructor() {
        this.STORAGE_KEY = "echo_neural_memory_v1";
        this.data = this.load();
    }

    load() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Corrupted memory file, resetting:", e);
            }
        }
        return {
            userName: "Alok",
            userTitle: "Creator",
            traits: [
                "Visionary developer",
                "Building Echo - Advanced AI Companion",
                "Prefers futuristic and clean design"
            ],
            facts: [
                "Wants Echo to have human-like emotional responsiveness",
                "Working on speech, memory, and personal integrations"
            ],
            reminders: [],
            conversationsCount: 0,
            lastSeen: new Date().toISOString()
        };
    }

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    getUserName() {
        return this.data.userName || "User";
    }

    setUserName(name) {
        this.data.userName = name.trim();
        this.save();
    }

    addFact(fact) {
        if (!fact || typeof fact !== "string") return;
        const cleaned = fact.trim();
        if (!this.data.facts.includes(cleaned)) {
            this.data.facts.push(cleaned);
            this.save();
        }
    }

    removeFact(index) {
        if (index >= 0 && index < this.data.facts.length) {
            this.data.facts.splice(index, 1);
            this.save();
        }
    }

    getFacts() {
        return this.data.facts || [];
    }

    addReminder(text, delayMs) {
        const reminder = {
            id: Date.now(),
            text,
            dueTime: Date.now() + delayMs,
            created: new Date().toISOString()
        };
        this.data.reminders.push(reminder);
        this.save();
        return reminder;
    }

    getReminders() {
        return this.data.reminders || [];
    }

    removeReminder(id) {
        this.data.reminders = this.data.reminders.filter(r => r.id !== id);
        this.save();
    }

    incrementInteractions() {
        this.data.conversationsCount = (this.data.conversationsCount || 0) + 1;
        this.data.lastSeen = new Date().toISOString();
        this.save();
    }

    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.data = this.load();
    }
}

window.echoMemory = new EchoMemory();
