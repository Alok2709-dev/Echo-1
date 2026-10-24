const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let currentMode = 'full'; // 'full' or 'island'
let isQuitting = false;

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
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    currentMode = mode;
    if (mode === 'island') {
        const islandWidth = 480;
        const islandHeight = 64;
        const islandX = Math.round((width - islandWidth) / 2);
        mainWindow.setAlwaysOnTop(true);
        mainWindow.setBounds({ x: islandX, y: 16, width: islandWidth, height: islandHeight }, true);
    } else {
        const fullW = Math.min(1380, width - 60);
        const fullH = Math.min(920, height - 60);
        const fullX = Math.round((width - fullW) / 2);
        const fullY = Math.round((height - fullH) / 2);
        mainWindow.setAlwaysOnTop(false);
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

        // 8. Universal App Launcher fallback (Attempts to launch any application requested)
        exec(`start "" "${command}"`, (err) => {
            if (err) {
                resolve({ success: false, error: `Could not launch "${command}". Make sure the application is installed.` });
            } else {
                resolve({ success: true, output: `Launched ${command}.` });
            }
        });
    });
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
