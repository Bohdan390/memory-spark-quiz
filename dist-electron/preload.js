const { contextBridge, ipcRenderer } = require('electron');
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Storage operations
    getFolders: () => ipcRenderer.invoke('get-folders'),
    saveFolders: (folders) => ipcRenderer.invoke('save-folders', folders),
    getNotes: () => ipcRenderer.invoke('get-notes'),
    saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),
    getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
    // Menu events
    onMenuNewFolder: (callback) => ipcRenderer.on('menu-new-folder', callback),
    onMenuNewNote: (callback) => ipcRenderer.on('menu-new-note', callback),
    onMenuAbout: (callback) => ipcRenderer.on('menu-about', callback),
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
module.exports = {};
