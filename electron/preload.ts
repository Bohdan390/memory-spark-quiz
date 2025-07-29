const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Storage operations
  getFolders: () => ipcRenderer.invoke('get-folders'),
  saveFolders: (folders) => ipcRenderer.invoke('save-folders', folders),
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  
  // Quiz operations
  getQuizQuestions: (folderId) => ipcRenderer.invoke('get-quiz-questions', folderId),
  saveQuizQuestions: (folderId, questions) => ipcRenderer.invoke('save-quiz-questions', folderId, questions),
  getQuizResults: (folderId) => ipcRenderer.invoke('get-quiz-results', folderId),
  saveQuizResults: (folderId, results) => ipcRenderer.invoke('save-quiz-results', folderId, results),
  
  // Settings operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Storage path
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  
  // Import/Export operations
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),
  
  // Menu events
  onMenuNewFolder: (callback) => ipcRenderer.on('menu-new-folder', callback),
  onMenuNewNote: (callback) => ipcRenderer.on('menu-new-note', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu-about', callback),
  onMenuStartQuiz: (callback) => ipcRenderer.on('menu-start-quiz', callback),
  onMenuGenerateQuiz: (callback) => ipcRenderer.on('menu-generate-quiz', callback),
  onMenuExportSuccess: (callback) => ipcRenderer.on('menu-export-success', callback),
  onMenuExportError: (callback) => ipcRenderer.on('menu-export-error', callback),
  onMenuImportSuccess: (callback) => ipcRenderer.on('menu-import-success', callback),
  onMenuImportError: (callback) => ipcRenderer.on('menu-import-error', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

module.exports = {}; 