const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow = null;
let tray = null;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width: Math.min(1380, width - 60),
        height: Math.min(920, height - 60),
        minWidth: 900,
        minHeight: 650,
        center: true,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        hasShadow: true,
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

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
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
    if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:toggle', () => {
    toggleWindow();
});

// OS Automation Execution Handlers
ipcMain.handle('os:execute', async (event, { command, args }) => {
    return new Promise((resolve) => {
        const allowedCommands = {
            'vscode': 'code',
            'code': 'code',
            'explorer': 'explorer',
            'notepad': 'notepad',
            'calculator': 'calc',
            'terminal': 'wt || powershell',
            'chrome': 'start chrome',
            'spotify': 'start spotify',
            'taskmgr': 'taskmgr'
        };

        const target = command.toLowerCase().trim();

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
                    resolve({ success: true, output: `Screenshot saved to Pictures: Echo_Capture_${timestamp}.png`, path: filePath });
                }
            });
            return;
        }

        if (target === 'volume') {
            const level = parseInt(args, 10);
            if (!isNaN(level)) {
                // Approximate Windows volume adjustment via nircmd or sendkeys
                const vScript = `
                    $obj = New-Object -ComObject WScript.Shell
                    1..50 | ForEach-Object { $obj.SendKeys([char]174) }
                    $steps = [math]::Round(${Math.min(100, Math.max(0, level))} / 2)
                    1..$steps | ForEach-Object { $obj.SendKeys([char]175) }
                `;
                exec(`powershell -NoProfile -Command "${vScript.replace(/\n/g, ';')}"`, (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true, output: `Master volume calibrated to ${level}%.` });
                });
                return;
            } else if (args === 'mute') {
                const muteScript = `$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]173)`;
                exec(`powershell -NoProfile -Command "${muteScript}"`, () => {
                    resolve({ success: true, output: "Audio output toggled / muted." });
                });
                return;
            }
        }

        if (target === 'status' || target === 'system-info') {
            const statusScript = `
                $os = Get-CimInstance Win32_OperatingSystem
                $freeMem = [math]::Round($os.FreePhysicalMemory / 1024, 0)
                $totalMem = [math]::Round($os.TotalVisibleMemorySize / 1024, 0)
                $usedMem = $totalMem - $freeMem
                $cpu = (Get-CimInstance Win32_Processor).LoadPercentage
                echo "$usedMem MB used of $totalMem MB | CPU Load: $cpu%"
            `;
            exec(`powershell -NoProfile -Command "${statusScript.replace(/\n/g, ';')}"`, (err, stdout) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, output: stdout.trim() });
            });
            return;
        }

        if (target === 'lock') {
            exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, output: "Workstation secured and locked." });
            });
            return;
        }

        if (allowedCommands[target]) {
            exec(`start "" ${allowedCommands[target]}`, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, output: `Application launched: ${target}.` });
            });
            return;
        }

        resolve({ success: false, error: `Command "${command}" is not in the authorized automation list.` });
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
