/* ==========================================================
   ECHO OS AUTOMATION BRIDGE
   Bridging Web & Electron IPC for Native Desktop Automation
========================================================== */

class EchoOSBridge {
    constructor() {
        this.isNative = typeof window.electronAPI !== "undefined" && window.electronAPI.isElectron;
        console.log(`[EchoOSBridge] Initialized. Native Desktop Mode: ${this.isNative}`);
    }

    async execute(command, args = "") {
        const cmd = command.toLowerCase().trim();

        if (this.isNative) {
            try {
                const res = await window.electronAPI.executeOS(cmd, args);
                return res;
            } catch (err) {
                return { success: false, error: err.message || "Execution failed" };
            }
        }

        // Browser Fallback (When running directly from browser / http server)
        return this.browserFallback(cmd, args);
    }

    browserFallback(command, args) {
        if (command === "vscode" || command === "code") {
            window.open("vscode://", "_blank");
            return { success: true, output: "Invoked VS Code URI protocol handler." };
        }
        if (command === "spotify") {
            window.open("spotify://", "_blank");
            return { success: true, output: "Invoked Spotify URI protocol handler." };
        }
        if (command === "calculator") {
            return { success: true, output: "Calculator requires Native Desktop Mode. You can ask Echo to calculate directly!" };
        }
        if (command === "screenshot") {
            return { success: false, output: "Screenshot capture requires running in Native Electron Mode (npm start)." };
        }
        if (command === "volume") {
            return { success: false, output: "Hardware volume adjustment requires Native Electron Mode (npm start)." };
        }

        return {
            success: false,
            output: `Native command "${command}" requires running Echo in Desktop Mode (npm start).`
        };
    }

    async openApp(appName) {
        const map = {
            "code": "vscode",
            "vs code": "vscode",
            "visual studio code": "vscode",
            "explorer": "explorer",
            "files": "explorer",
            "file explorer": "explorer",
            "notepad": "notepad",
            "calculator": "calculator",
            "terminal": "terminal",
            "cmd": "terminal",
            "powershell": "terminal",
            "chrome": "chrome",
            "spotify": "spotify",
            "task manager": "taskmgr"
        };

        const target = map[appName.toLowerCase().trim()] || appName.toLowerCase().trim();
        return await this.execute(target);
    }

    async takeScreenshot() {
        return await this.execute("screenshot");
    }

    async setVolume(level) {
        return await this.execute("volume", level);
    }

    async muteVolume() {
        return await this.execute("volume", "mute");
    }

    async getSystemStatus() {
        return await this.execute("status");
    }

    async lockWorkstation() {
        return await this.execute("lock");
    }
}

window.echoOSBridge = new EchoOSBridge();
