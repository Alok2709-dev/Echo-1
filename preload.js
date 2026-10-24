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
    onModeChanged: (callback) => ipcRenderer.on('mode:changed', (event, mode) => callback(mode))
});
