/* ==========================================================
   ECHO — BOOT LOADER & SYSTEM INITIALIZER
========================================================== */

const bootMessages = [
    "Initializing Neural Lattice...",
    "Harmonizing Quantum Audio Engine...",
    "Syncing Memory Core...",
    "Awakening Sentient Consciousness..."
];

const statusEl = document.getElementById("status");
let bootIndex = 0;

const bootInterval = setInterval(() => {
    bootIndex++;
    if (bootIndex < bootMessages.length && statusEl) {
        statusEl.textContent = bootMessages[bootIndex];
    }
}, 600);

let hasBooted = false;

function finishBoot() {
    if (hasBooted) return;
    hasBooted = true;
    clearInterval(bootInterval);

    const loader = document.getElementById("loader");
    const room = document.getElementById("room");

    if (loader) loader.classList.add("loaderHide");
    if (room) room.classList.remove("hidden");

    // Trigger Echo's voice and welcome sequence
    setTimeout(() => {
        if (typeof window.activateEcho === "function") {
            window.activateEcho();
        }
    }, 400);
}

// Snappy auto-finish after 2.6 seconds
const autoBootTimer = setTimeout(finishBoot, 2600);

// Immediate skip on click or keypress
const loaderElement = document.getElementById("loader");
if (loaderElement) {
    loaderElement.addEventListener("click", () => {
        clearTimeout(autoBootTimer);
        finishBoot();
    });
}

document.addEventListener("keydown", (e) => {
    if (!hasBooted && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
        clearTimeout(autoBootTimer);
        finishBoot();
    }
});
