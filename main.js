const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, screen, clipboard, shell } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

// Enable Speech and Audio permissions for Electron
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('enable-features', 'SpeechRecognition,MediaStreamTrack');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;
let tray = null;
let currentMode = 'full'; // 'full' or 'island'
let isQuitting = false;
let voiceBridgeServer = null;
let voiceEarProcess = null;
let voiceBridgePort = 0;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width: Math.min(1380, width - 60),
        height: Math.min(920, height - 60),
        minWidth: 360,
        minHeight: 56,
        center: true,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        hasShadow: true,
        alwaysOnTop: false,
        skipTaskbar: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    // Grant all media and microphone permissions automatically
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(true);
    });
    mainWindow.webContents.session.setPermissionCheckHandler(() => true);

    mainWindow.loadFile('index.html');

    // Register Alt+Space & Ctrl+Shift+Space global hotkeys
    try {
        globalShortcut.register('Alt+Space', () => {
            toggleWindow();
        });
        globalShortcut.register('CommandOrControl+Shift+Space', () => {
            toggleWindow();
        });
    } catch (err) {
        console.warn('Could not register global hotkey:', err);
    }

    // Hide to tray instead of quitting when closed (Permanent Background Assistant)
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createTray();
}

function createTray() {
    if (tray) return;

    try {
        const iconPath = path.join(__dirname, 'icon.png');
        if (!fs.existsSync(iconPath)) {
            const fallbackBuf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
            fs.writeFileSync(iconPath, fallbackBuf);
        }

        tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Echo — Sentient AI', enabled: false },
            { type: 'separator' },
            {
                label: 'Show / Hide Echo (Alt+Space)',
                click: () => toggleWindow()
            },
            {
                label: 'Toggle Dynamic Island Mode',
                click: () => setWindowMode(currentMode === 'island' ? 'full' : 'island')
            },
            {
                label: 'Launch at Windows Startup',
                type: 'checkbox',
                checked: app.getLoginItemSettings().openAtLogin,
                click: (item) => {
                    app.setLoginItemSettings({ openAtLogin: item.checked });
                }
            },
            { type: 'separator' },
            {
                label: 'Exit Completely',
                click: () => {
                    isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('Echo AI Companion');
        tray.setContextMenu(contextMenu);
        tray.on('click', () => toggleWindow());
    } catch (err) {
        console.warn('Tray initialization fallback:', err);
    }
}

function toggleWindow() {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
        if (mainWindow.isFocused()) {
            mainWindow.hide();
        } else {
            mainWindow.focus();
        }
    } else {
        mainWindow.show();
        mainWindow.focus();
    }
}

function setWindowMode(mode) {
    if (!mainWindow) return;

    // Detect the exact display where the window currently resides (Multi-monitor & High-DPI support)
    const bounds = mainWindow.getBounds();
    const activeDisplay = screen.getDisplayNearestPoint({
        x: bounds.x + Math.round(bounds.width / 2),
        y: bounds.y + Math.round(bounds.height / 2)
    }) || screen.getPrimaryDisplay();

    const { width: screenW, height: screenH, x: screenX, y: screenY } = activeDisplay.workArea;

    currentMode = mode;
    if (mode === 'island') {
        const islandWidth = 490;
        const islandHeight = 68;
        const islandX = Math.round(screenX + (screenW - islandWidth) / 2);
        const islandY = screenY + 12;

        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        mainWindow.setBounds({ x: islandX, y: islandY, width: islandWidth, height: islandHeight }, true);
    } else {
        const fullW = Math.min(1380, screenW - 60);
        const fullH = Math.min(920, screenH - 60);
        const fullX = Math.round(screenX + (screenW - fullW) / 2);
        const fullY = Math.round(screenY + (screenH - fullH) / 2);

        mainWindow.setAlwaysOnTop(false);
        mainWindow.setVisibleOnAllWorkspaces(false);
        mainWindow.setBounds({ x: fullX, y: fullY, width: fullW, height: fullH }, true);
    }

    mainWindow.webContents.send('mode:changed', mode);
}

// Window controls IPC
ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.hide();
});

ipcMain.handle('window:toggle', () => {
    toggleWindow();
});

ipcMain.handle('window:set-mode', (event, mode) => {
    setWindowMode(mode);
    return { success: true, mode: currentMode };
});

ipcMain.handle('app:set-startup', (event, enabled) => {
    app.setLoginItemSettings({ openAtLogin: enabled });
    return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('app:get-startup', () => {
    return app.getLoginItemSettings().openAtLogin;
});

// Smart Universal Windows Path Resolver (Handles fuzzy folder names like 'alods', 'alok', 'desktop', etc.)
function resolveSmartPath(rawPath) {
    if (!rawPath) return app.getPath('desktop');
    let p = rawPath.trim().replace(/^["']|["']$/g, '');
    const homeDir = app.getPath('home');
    const desktopDir = app.getPath('desktop');

    // Split initial segment to test known shortcuts
    const normalized = p.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const firstSegment = parts[0].toLowerCase();

    const specialDirs = {
        'desktop': desktopDir,
        'downloads': app.getPath('downloads'),
        'documents': app.getPath('documents'),
        'docs': app.getPath('documents'),
        'pictures': app.getPath('pictures'),
        'pics': app.getPath('pictures'),
        'music': app.getPath('music'),
        'home': homeDir,
        'user': homeDir,
        'alok': path.join(desktopDir, 'alok'),
        'aloks': homeDir,
        'alods': path.join(desktopDir, 'alods')
    };

    if (specialDirs[firstSegment]) {
        const sub = parts.slice(1).join(path.sep);
        return sub ? path.join(specialDirs[firstSegment], sub) : specialDirs[firstSegment];
    }

    if (path.isAbsolute(p)) {
        return p;
    }

    // Default relative paths to Desktop
    return path.join(desktopDir, p);
}

// Real Windows File System & Directory Operations
ipcMain.handle('fs:create-file', async (event, { filePath, content }) => {
    try {
        const resolved = resolveSmartPath(filePath);
        const parentDir = path.dirname(resolved);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(resolved, content || '', 'utf8');
        return {
            success: true,
            path: resolved,
            message: `File created successfully: ${path.basename(resolved)} in ${parentDir}`
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('fs:create-folder', async (event, { folderPath }) => {
    try {
        const resolved = resolveSmartPath(folderPath);
        fs.mkdirSync(resolved, { recursive: true });
        return {
            success: true,
            path: resolved,
            message: `Folder created successfully: ${path.basename(resolved)} at ${resolved}`
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('fs:read-file', async (event, { filePath }) => {
    try {
        const resolved = resolveSmartPath(filePath);
        if (!fs.existsSync(resolved)) {
            return { success: false, error: `File not found at ${resolved}` };
        }
        const data = fs.readFileSync(resolved, 'utf8');
        return { success: true, content: data, path: resolved };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('fs:list-files', async (event, { folderPath }) => {
    try {
        const resolved = resolveSmartPath(folderPath || 'desktop');
        if (!fs.existsSync(resolved)) {
            return { success: false, error: `Directory does not exist: ${resolved}` };
        }
        const files = fs.readdirSync(resolved);
        return { success: true, files: files.slice(0, 30), path: resolved };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('fs:open-file', async (event, { filePath }) => {
    try {
        const resolved = resolveSmartPath(filePath);
        if (fs.existsSync(resolved)) {
            shell.openPath(resolved);
            return { success: true, message: `Opened ${path.basename(resolved)}` };
        }
        return { success: false, error: `File not found: ${resolved}` };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('fs:reveal-file', async (event, { filePath }) => {
    try {
        const resolved = resolveSmartPath(filePath);
        if (fs.existsSync(resolved)) {
            shell.showItemInFolder(resolved);
            return { success: true, message: `Revealed in Windows Explorer.` };
        }
        return { success: false, error: `Path not found: ${resolved}` };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// Terminal / PowerShell Command Runner
ipcMain.handle('os:run-cmd', async (event, { command }) => {
    return new Promise((resolve) => {
        exec(command, { timeout: 15000 }, (err, stdout, stderr) => {
            if (err) resolve({ success: false, error: stderr || err.message });
            else resolve({ success: true, output: (stdout || 'Command completed successfully.').trim() });
        });
    });
});

// Clipboard Handler
ipcMain.handle('os:clipboard', (event, text) => {
    clipboard.writeText(text);
    return { success: true, message: `Copied to clipboard: "${text}"` };
});

// Bulletproof Native Windows SAPI Speech Synthesis IPC
ipcMain.handle('os:speak', async (event, text) => {
    return new Promise((resolve) => {
        if (!text || typeof text !== 'string') return resolve({ success: false });
        const clean = text
            .replace(/\[(idle|happy|thinking|alert|speaking)\]/gi, '')
            .replace(/[*_#`~>]/g, '')
            .replace(/["'`$\\]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!clean) return resolve({ success: false });

        const psScript = `
            Add-Type -AssemblyName System.Speech;
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
            $synth.Rate = 1;
            $synth.Speak([string]"${clean.substring(0, 300)}");
        `;
        exec(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/\n/g, ' ')}"`, (err) => {
            if (err) resolve({ success: false, error: err.message });
            else resolve({ success: true });
        });
    });
});

// Screen Vision / Capture IPC
ipcMain.handle('screen:capture', async () => {
    return new Promise((resolve) => {
        const timestamp = Date.now();
        const filePath = path.join(app.getPath('temp'), `echo_vision_screen_${timestamp}.png`);
        const psScript = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
            $graphics = [System.Drawing.Graphics]::FromImage($bmp)
            $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
            $bmp.Save("${filePath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose()
            $bmp.Dispose()
        `;
        exec(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ';')}"`, (err) => {
            if (err) {
                resolve({ success: false, error: err.message });
            } else {
                try {
                    const data = fs.readFileSync(filePath);
                    const base64 = data.toString('base64');
                    fs.unlink(filePath, () => {});
                    resolve({ success: true, base64: `data:image/png;base64,${base64}` });
                } catch (readErr) {
                    resolve({ success: false, error: readErr.message });
                }
            }
        });
    });
});

// Full Windows PC Automation Matrix
ipcMain.handle('os:execute', async (event, { command, args }) => {
    return new Promise((resolve) => {
        const target = command.toLowerCase().trim();

        // 1. Applications & Protocol Map
        const appMap = {
            'vscode': 'code',
            'code': 'code',
            'explorer': 'explorer',
            'files': 'explorer',
            'notepad': 'notepad',
            'calculator': 'calc',
            'calc': 'calc',
            'terminal': 'wt || powershell',
            'powershell': 'powershell',
            'cmd': 'cmd',
            'chrome': 'start chrome',
            'spotify': 'start spotify',
            'taskmgr': 'taskmgr',
            'task manager': 'taskmgr',
            'paint': 'mspaint',
            'settings': 'start ms-settings:',
            'control panel': 'control',
            'discord': 'start discord:// || start https://discord.com',
            'steam': 'start steam://',
            'whatsapp': 'start whatsapp:// || start https://web.whatsapp.com',
            'word': 'start winword',
            'excel': 'start excel',
            'powerpoint': 'start powerpnt',
            'edge': 'start msedge',
            'brave': 'start brave'
        };

        // 2. Folder Shell Targets
        const folderMap = {
            'downloads': 'start shell:Downloads',
            'desktop': 'start shell:Desktop',
            'documents': 'start shell:Personal',
            'pictures': 'start shell:My Pictures',
            'music': 'start shell:My Music',
            'c drive': 'explorer C:\\',
            'recycle bin': 'start shell:RecycleBinFolder'
        };

        if (folderMap[target]) {
            exec(folderMap[target], (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, output: `Opened ${target} folder.` });
            });
            return;
        }

        if (appMap[target]) {
            exec(`start "" ${appMap[target]}`, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, output: `Launched ${target}.` });
            });
            return;
        }

        // 3. Screenshot Capture
        if (target === 'screenshot') {
            const timestamp = Date.now();
            const filePath = path.join(app.getPath('pictures'), `Echo_Capture_${timestamp}.png`);
            const psScript = `
                Add-Type -AssemblyName System.Windows.Forms
                Add-Type -AssemblyName System.Drawing
                $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
                $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
                $graphics = [System.Drawing.Graphics]::FromImage($bmp)
                $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
                $bmp.Save("${filePath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
                $graphics.Dispose()
                $bmp.Dispose()
                echo "${filePath.replace(/\\/g, '\\\\')}"
            `;
            exec(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ';')}"`, (err, stdout, stderr) => {
                if (err) {
                    resolve({ success: false, error: stderr || err.message });
                } else {
                    resolve({ success: true, output: `Screenshot saved to Pictures folder: Echo_Capture_${timestamp}.png`, path: filePath });
                }
            });
            return;
        }

        // 4. Volume Adjustment
        if (target === 'volume') {
            if (args === 'up') {
                const vScript = `$obj = New-Object -ComObject WScript.Shell; 1..5 | ForEach-Object { $obj.SendKeys([char]175) }`;
                exec(`powershell -NoProfile -Command "${vScript}"`, () => resolve({ success: true, output: "Master volume increased." }));
                return;
            } else if (args === 'down') {
                const vScript = `$obj = New-Object -ComObject WScript.Shell; 1..5 | ForEach-Object { $obj.SendKeys([char]174) }`;
                exec(`powershell -NoProfile -Command "${vScript}"`, () => resolve({ success: true, output: "Master volume decreased." }));
                return;
            } else if (args === 'mute') {
                const muteScript = `$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]173)`;
                exec(`powershell -NoProfile -Command "${muteScript}"`, () => resolve({ success: true, output: "Audio output toggled / muted." }));
                return;
            }

            const level = parseInt(args, 10);
            if (!isNaN(level)) {
                const vScript = `
                    $obj = New-Object -ComObject WScript.Shell
                    1..50 | ForEach-Object { $obj.SendKeys([char]174) }
                    $steps = [math]::Round(${Math.min(100, Math.max(0, level))} / 2)
                    1..$steps | ForEach-Object { $obj.SendKeys([char]175) }
                `;
                exec(`powershell -NoProfile -Command "${vScript.replace(/\n/g, ';')}"`, (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true, output: `Volume set to ${level}%.` });
                });
                return;
            }
        }

        // 5. Windows Management (Show Desktop, Close Window, Switch Window)
        if (target === 'show-desktop' || target === 'minimize-all') {
            exec(`powershell -NoProfile -Command "(New-Object -ComObject Shell.Application).MinimizeAll()"`, () => {
                resolve({ success: true, output: "Minimized all windows and showing desktop." });
            });
            return;
        }

        if (target === 'close-window') {
            exec(`powershell -NoProfile -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('%{F4}')"`, () => {
                resolve({ success: true, output: "Closed active window." });
            });
            return;
        }

        if (target === 'switch-window') {
            exec(`powershell -NoProfile -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('%{TAB}')"`, () => {
                resolve({ success: true, output: "Switched to previous window." });
            });
            return;
        }

        // 6. Workstation Security & Power
        if (target === 'lock') {
            exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, output: "Workstation secured and locked." });
            });
            return;
        }

        if (target === 'sleep') {
            exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0', (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, output: "Putting workstation to sleep." });
            });
            return;
        }

        if (target === 'empty-recycle-bin') {
            exec('powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"', () => {
                resolve({ success: true, output: "Recycle Bin emptied." });
            });
            return;
        }

        // 7. System Hardware Telemetry
        if (target === 'status' || target === 'system-info') {
            const statusScript = `
                $os = Get-CimInstance Win32_OperatingSystem
                $freeMem = [math]::Round($os.FreePhysicalMemory / 1024, 0)
                $totalMem = [math]::Round($os.TotalVisibleMemorySize / 1024, 0)
                $usedMem = $totalMem - $freeMem
                $cpu = (Get-CimInstance Win32_Processor).LoadPercentage
                $disk = Get-PSDrive C
                $freeDisk = [math]::Round($disk.Free / 1GB, 1)
                echo "$usedMem MB used of $totalMem MB RAM | CPU Load: $cpu% | C Drive Free: $freeDisk GB"
            `;
            exec(`powershell -NoProfile -Command "${statusScript.replace(/\n/g, ';')}"`, (err, stdout) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, output: stdout.trim() });
            });
            return;
        }

        // 8. Universal App Launcher fallback
        exec(`start "" "${command}"`, (err) => {
            if (err) {
                resolve({ success: false, error: `Could not launch "${command}". Make sure the application is installed.` });
            } else {
                resolve({ success: true, output: `Launched ${command}.` });
            }
        });
    });
});

// Native Windows Speech Recognition Ear Bridge (Connects via Edge/Chrome Offline Speech Engine)
function startVoiceBridge() {
    try {
        voiceBridgeServer = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            if (req.url === '/speech-bridge') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<!DOCTYPE html>
<html>
<head><title>Echo Voice Bridge</title></head>
<body style="background:#09090e;color:#00e5ff;font-family:sans-serif;padding:16px;">
  <div style="font-size:13px;font-weight:bold;color:#00e5ff;">ECHO NATIVE AUDIO EAR ENGINE</div>
  <div id="status" style="color:#888;font-size:11px;margin-top:4px;">Connecting to Windows Speech API...</div>
  <div id="heard" style="margin-top:10px;font-size:14px;color:#fff;word-break:break-word;"></div>
  <script>
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    let isStarted = false;

    function initSpeech() {
        if (!SpeechRec) {
            document.getElementById('status').textContent = 'Web Speech API unavailable.';
            return;
        }

        rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
            isStarted = true;
            document.getElementById('status').textContent = 'EAR ACTIVE & LISTENING (Zero Lag)';
            fetch('/voice-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: true, message: 'Windows Speech Ear Connected' })
            }).catch(() => {});
        };

        rec.onresult = (e) => {
            let interim = '';
            let finalStr = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const text = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalStr += text;
                else interim += text;
            }
            const active = (finalStr || interim).trim();
            if (active) {
                document.getElementById('heard').textContent = active;
                fetch('/voice-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ final: finalStr.trim(), interim: interim.trim() })
                }).catch(() => {});
            }
        };

        rec.onerror = (e) => {
            document.getElementById('status').textContent = 'Ear Status: ' + (e.error || 'reconnecting');
            if (e.error !== 'no-speech') {
                setTimeout(restart, 1000);
            }
        };

        rec.onend = () => {
            isStarted = false;
            setTimeout(restart, 400);
        };

        try { rec.start(); } catch(err){ setTimeout(restart, 1000); }
    }

    function restart() {
        if (rec) {
            try { rec.abort(); } catch(e){}
            try { rec.start(); } catch(e){}
        }
    }

    // Keep-alive heartbeat every 5s
    setInterval(() => {
        if (!isStarted) restart();
    }, 5000);

    initSpeech();
  </script>
</body>
</html>`);
                return;
            }

            if (req.url === '/voice-status' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('voice:status', data);
                        }
                    } catch (e) {}
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                });
                return;
            }

            if (req.url === '/voice-data' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('voice:native-transcript', data);
                        }
                    } catch (e) {}
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                });
                return;
            }

            res.writeHead(404);
            res.end();
        });

        voiceBridgeServer.listen(0, '127.0.0.1', () => {
            voiceBridgePort = voiceBridgeServer.address().port;
            console.log(`[Echo] Native voice bridge listening on http://127.0.0.1:${voiceBridgePort}`);
            launchVoiceEar(voiceBridgePort);
        });
    } catch (e) {
        console.warn('Could not initialize native voice bridge:', e);
    }
}

function launchVoiceEar(port) {
    const candidatePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const binary = candidatePaths.find(p => fs.existsSync(p));
    if (!binary) {
        console.warn('[Echo] No Edge or Chrome found for background speech ear.');
        return;
    }

    const earProfileDir = path.join(app.getPath('temp'), 'echo_voice_ear_profile');
    try {
        if (!fs.existsSync(earProfileDir)) fs.mkdirSync(earProfileDir, { recursive: true });
    } catch (e) {}

    const earArgs = [
        `--app=http://127.0.0.1:${port}/speech-bridge`,
        `--user-data-dir=${earProfileDir}`,
        `--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:${port},http://localhost:${port}`,
        '--window-size=240,160',
        '--window-position=50,50',
        '--minimized',
        '--use-fake-ui-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
        '--enable-features=SpeechRecognition',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=Translate',
        '--no-first-run',
        '--no-default-browser-check'
    ];

    try {
        voiceEarProcess = spawn(binary, earArgs, {
            detached: false,
            stdio: 'ignore'
        });
        voiceEarProcess.on('error', (err) => console.warn('[Echo] Voice ear error:', err));
        console.log('[Echo] Native Windows Voice Ear launched successfully via', path.basename(binary));
    } catch (e) {
        console.warn('[Echo] Failed to spawn voice ear:', e);
    }
}

app.whenReady().then(() => {
    createWindow();
    startVoiceBridge();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (voiceEarProcess) {
        try { voiceEarProcess.kill(); } catch (e) {}
        voiceEarProcess = null;
    }
    if (voiceBridgeServer) {
        try { voiceBridgeServer.close(); } catch (e) {}
        voiceBridgeServer = null;
    }
});
