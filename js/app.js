/* ==========================================================
   ECHO — MAIN CONTROLLER & APPLE-GRADE INTERACTION ENGINE
   Zero-dependency, 100% offline & file:// protocol compatible
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const dialogueSpeaker = document.getElementById("dialogueSpeaker");
    const dialogueText = document.getElementById("dialogueText");
    const commandInput = document.getElementById("commandInput");
    const sendBtn = document.getElementById("sendBtn");
    const micBtn = document.getElementById("micBtn");
    const memoryBtn = document.getElementById("memoryBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const soundToggleBtn = document.getElementById("soundToggleBtn");
    const memoryModal = document.getElementById("memoryModal");
    const settingsModal = document.getElementById("settingsModal");
    const clockDisplay = document.getElementById("hudClock");
    const quickPrompts = document.querySelectorAll(".quick-chip");

    // Sound toggle state
    let soundEnabled = true;
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            if (window.echoSounds) window.echoSounds.enabled = soundEnabled;
            soundToggleBtn.classList.toggle("muted", !soundEnabled);
            soundToggleBtn.title = soundEnabled ? "Mute UI Chimes" : "Unmute UI Chimes";
        });
    }

    // Header Clock
    function updateClock() {
        if (clockDisplay) {
            const now = new Date();
            clockDisplay.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Smooth Typewriter effect for dialogue
    let typeTimeout = null;
    function displayDialogue(speaker, text) {
        if (dialogueSpeaker) dialogueSpeaker.textContent = speaker.toUpperCase();
        if (!dialogueText) return;

        clearTimeout(typeTimeout);
        dialogueText.textContent = "";
        let i = 0;
        function type() {
            if (i < text.length) {
                dialogueText.textContent += text.charAt(i);
                i++;
                typeTimeout = setTimeout(type, 18);
            }
        }
        type();
    }

    // Process user input
    async function handleUserMessage(message) {
        if (!message || !message.trim()) return;
        const trimmed = message.trim();

        // Display user query
        displayDialogue("You", trimmed);
        if (commandInput) commandInput.value = "";

        // Shift core to thinking state
        if (window.echoCore) window.echoCore.setEmotion("thinking");

        try {
            const response = await window.echoBrain.processInput(trimmed);
            if (response) {
                if (window.echoSounds) {
                    if (response.emotion === "alert") window.echoSounds.playAlertTone();
                    else window.echoSounds.playResponseChime();
                }

                if (window.echoCore) window.echoCore.setEmotion(response.emotion);
                displayDialogue("Echo", response.text);

                if (window.echoVoice) {
                    window.echoVoice.speak(response.text, response.emotion, () => {
                        if (window.echoCore) window.echoCore.setEmotion("idle");
                    });
                }
            }
        } catch (e) {
            console.error("Error processing message:", e);
            displayDialogue("Echo", "Cognitive alignment completed. How else may I assist you?");
            if (window.echoCore) window.echoCore.setEmotion("idle");
        }
    }

    // Input handlers
    if (sendBtn && commandInput) {
        sendBtn.addEventListener("click", () => {
            handleUserMessage(commandInput.value);
        });

        commandInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                handleUserMessage(commandInput.value);
            }
        });
    }

    // Quick Action Prompt Chips (Click to ask instantly)
    quickPrompts.forEach(chip => {
        chip.addEventListener("click", () => {
            const query = chip.getAttribute("data-prompt") || chip.textContent.trim();
            handleUserMessage(query);
        });
    });

    // Voice recognition handlers
    if (micBtn && window.echoVoice) {
        micBtn.addEventListener("click", () => {
            if (window.echoSounds) window.echoSounds.playListenTick();
            const isListening = window.echoVoice.toggleListening();
            micBtn.classList.toggle("listening", isListening);
        });

        window.echoVoice.onTranscriptCallback = (transcript) => {
            handleUserMessage(transcript);
        };

        window.echoVoice.onStateChangeCallback = (state) => {
            if (micBtn) {
                micBtn.classList.toggle("listening", state === "listening");
            }
            if (window.echoCore) {
                window.echoCore.setEmotion(state);
            }
        };
    }

    // Spacebar to talk shortcut
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            e.preventDefault();
            if (window.echoSounds) window.echoSounds.playListenTick();
            if (window.echoVoice) {
                const isListening = window.echoVoice.toggleListening();
                if (micBtn) micBtn.classList.toggle("listening", isListening);
            }
        }
    });

    // Emotion Pills (Right-hand manual switcher)
    document.querySelectorAll(".emotion-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            const emote = pill.getAttribute("data-emotion");
            if (window.echoCore) window.echoCore.setEmotion(emote);
            if (window.echoSounds) window.echoSounds.playListenTick();
            document.querySelectorAll(".emotion-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
        });
    });

    // Memory Modal Setup
    function renderMemoryList() {
        const list = document.getElementById("memoryList");
        if (!list || !window.echoMemory) return;
        list.innerHTML = "";
        const facts = window.echoMemory.getFacts();
        if (facts.length === 0) {
            list.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 13px; text-align: center; padding: 18px;">No memories recorded yet. Tell Echo "Remember that..." to start!</div>`;
            return;
        }
        facts.forEach((fact, idx) => {
            const item = document.createElement("div");
            item.className = "memory-item";
            item.innerHTML = `
                <span>${fact}</span>
                <button class="memory-del" data-index="${idx}" title="Remove">&times;</button>
            `;
            list.appendChild(item);
        });

        list.querySelectorAll(".memory-del").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = parseInt(e.target.getAttribute("data-index"), 10);
                window.echoMemory.removeFact(index);
                renderMemoryList();
            });
        });
    }

    if (memoryBtn && memoryModal) {
        memoryBtn.addEventListener("click", () => {
            renderMemoryList();
            memoryModal.classList.add("active");
        });
    }

    // Settings Modal Setup
    if (settingsBtn && settingsModal) {
        const apiKeyInput = document.getElementById("apiKeyInput");
        const saveSettingsBtn = document.getElementById("saveSettingsBtn");

        settingsBtn.addEventListener("click", () => {
            if (apiKeyInput && window.echoBrain) {
                apiKeyInput.value = window.echoBrain.getApiKey();
            }
            settingsModal.classList.add("active");
        });

        if (saveSettingsBtn && apiKeyInput) {
            saveSettingsBtn.addEventListener("click", () => {
                window.echoBrain.setApiKey(apiKeyInput.value);
                settingsModal.classList.remove("active");
                displayDialogue("Echo", "Neural API configurations locked in. All cognition pipelines active.");
                if (window.echoSounds) window.echoSounds.playResponseChime();
            });
        }
    }

    // Modal dismissers
    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".hud-modal").forEach(m => m.classList.remove("active"));
        });
    });

    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("hud-modal")) {
            e.target.classList.remove("active");
        }
    });

    // Boot complete activation & welcome greeting
    window.activateEcho = function() {
        const userName = window.echoMemory ? window.echoMemory.getUserName() : "User";
        displayDialogue("Echo", `Neural connection online. Greetings, ${userName}. What shall we explore today?`);
        if (window.echoSounds) window.echoSounds.playWakeChime();
        if (window.echoVoice) {
            window.echoVoice.speak(`Neural connection online. Greetings, ${userName}. What shall we explore today?`, "happy");
        }
    };
});
