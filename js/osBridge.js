/* ==========================================================
   ECHO OS AUTOMATION BRIDGE (Full Windows PC Control Matrix)
========================================================== */

class EchoOSBridge {
    constructor() {
        this.isNative = typeof window.electronAPI !== "undefined" && window.electronAPI.isElectron;
        console.log(`[EchoOSBridge] Initialized. Native Windows Mode: ${this.isNative}`);
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
        if (command === "discord") {
            window.open("discord://", "_blank");
            return { success: true, output: "Invoked Discord protocol." };
        }
        if (command === "whatsapp") {
            window.open("https://web.whatsapp.com", "_blank");
            return { success: true, output: "Opening WhatsApp Web." };
        }
        if (command === "screenshot") {
            return { success: false, output: "Screenshot capture requires running in Native Desktop Mode (run-echo.bat)." };
        }
        if (command === "volume") {
            return { success: false, output: "System volume control requires Native Desktop Mode (run-echo.bat)." };
        }

        return {
            success: false,
            output: `Native command "${command}" requires running Echo via run-echo.bat.`
        };
    }

    async createFile(filePath, content = "") {
        if (this.isNative && window.electronAPI.createFile) {
            return await window.electronAPI.createFile(filePath, content);
        }
        return { success: false, error: "File creation requires Native Desktop Mode (run-echo.bat)." };
    }

    async createFolder(folderPath) {
        if (this.isNative && window.electronAPI.createFolder) {
            return await window.electronAPI.createFolder(folderPath);
        }
        return { success: false, error: "Folder creation requires Native Desktop Mode (run-echo.bat)." };
    }

    async readFile(filePath) {
        if (this.isNative && window.electronAPI.readFile) {
            return await window.electronAPI.readFile(filePath);
        }
        return { success: false, error: "Reading files requires Native Desktop Mode (run-echo.bat)." };
    }

    async listFiles(folderPath = "desktop") {
        if (this.isNative && window.electronAPI.listFiles) {
            return await window.electronAPI.listFiles(folderPath);
        }
        return { success: false, error: "Listing files requires Native Desktop Mode (run-echo.bat)." };
    }

    async runCommand(command) {
        if (this.isNative && window.electronAPI.runCmd) {
            return await window.electronAPI.runCmd(command);
        }
        return { success: false, error: "Running shell commands requires Native Desktop Mode (run-echo.bat)." };
    }

    async copyToClipboard(text) {
        if (this.isNative && window.electronAPI.setClipboard) {
            return await window.electronAPI.setClipboard(text);
        }
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return { success: true, message: `Copied to clipboard: "${text}"` };
        }
        return { success: false, error: "Clipboard access not supported." };
    }

    async openApp(appName) {
        return await this.execute(appName);
    }

    async openFolder(folderName) {
        return await this.execute(folderName);
    }

    async showDesktop() {
        return await this.execute("show-desktop");
    }

    async closeWindow() {
        return await this.execute("close-window");
    }

    async switchWindow() {
        return await this.execute("switch-window");
    }

    async sleepPC() {
        return await this.execute("sleep");
    }

    async emptyRecycleBin() {
        return await this.execute("empty-recycle-bin");
    }

    async takeScreenshot() {
        return await this.execute("screenshot");
    }

    async setVolume(level) {
        return await this.execute("volume", level);
    }

    async volumeUp() {
        return await this.execute("volume", "up");
    }

    async volumeDown() {
        return await this.execute("volume", "down");
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
