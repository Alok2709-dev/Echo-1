const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    platform: process.platform,
    toggleWindow: () => ipcRenderer.invoke('window:toggle'),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    setMode: (mode) => ipcRenderer.invoke('window:set-mode', mode),
    captureScreen: () => ipcRenderer.invoke('screen:capture'),
    setStartup: (enabled) => ipcRenderer.invoke('app:set-startup', enabled),
    getStartup: () => ipcRenderer.invoke('app:get-startup'),
    executeOS: (command, args) => ipcRenderer.invoke('os:execute', { command, args }),
    createFile: (filePath, content) => ipcRenderer.invoke('fs:create-file', { filePath, content }),
    createFolder: (folderPath) => ipcRenderer.invoke('fs:create-folder', { folderPath }),
    readFile: (filePath) => ipcRenderer.invoke('fs:read-file', { filePath }),
    listFiles: (folderPath) => ipcRenderer.invoke('fs:list-files', { folderPath }),
    openFile: (filePath) => ipcRenderer.invoke('fs:open-file', { filePath }),
    revealFile: (filePath) => ipcRenderer.invoke('fs:reveal-file', { filePath }),
    runCmd: (command) => ipcRenderer.invoke('os:run-cmd', { command }),
    setClipboard: (text) => ipcRenderer.invoke('os:clipboard', text),
    speakNative: (text) => ipcRenderer.invoke('os:speak', text),
    onModeChanged: (callback) => ipcRenderer.on('mode:changed', (event, mode) => callback(mode)),
    onNativeVoiceTranscript: (callback) => ipcRenderer.on('voice:native-transcript', (event, data) => callback(data)),
    onVoiceStatus: (callback) => ipcRenderer.on('voice:status', (event, data) => callback(data))
});
