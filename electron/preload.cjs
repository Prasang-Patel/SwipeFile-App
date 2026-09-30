const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openMediaFile: () => ipcRenderer.invoke('dialog:openMediaFile'),
  getStoragePaths: () => ipcRenderer.invoke('storage:getPaths'),
  openMediaFolder: () => ipcRenderer.invoke('storage:openMediaFolder')
});
