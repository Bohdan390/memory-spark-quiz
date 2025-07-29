import { Folder, Note, QuizQuestion, QuizResult } from '@/types/models';

// Type definitions for Electron API
declare global {
  interface Window {
    electronAPI?: {
      getFolders: () => Promise<Folder[]>;
      saveFolders: (folders: Folder[]) => Promise<boolean>;
      getNotes: () => Promise<Note[]>;
      saveNotes: (notes: Note[]) => Promise<boolean>;
      getQuizQuestions: (folderId: string) => Promise<QuizQuestion[]>;
      saveQuizQuestions: (folderId: string, questions: QuizQuestion[]) => Promise<boolean>;
      getQuizResults: (folderId: string) => Promise<QuizResult[]>;
      saveQuizResults: (folderId: string, results: QuizResult[]) => Promise<boolean>;
      getSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<boolean>;
      getStoragePath: () => Promise<string>;
      onMenuNewFolder: (callback: () => void) => void;
      onMenuNewNote: (callback: () => void) => void;
      onMenuAbout: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

class ElectronDataService {
  private isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Folder operations
  async getFolders(): Promise<Folder[]> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.getFolders();
  }

  async saveFolders(folders: Folder[]): Promise<boolean> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.saveFolders(folders);
  }

  // Note operations
  async getNotes(): Promise<Note[]> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.getNotes();
  }

  async saveNotes(notes: Note[]): Promise<boolean> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.saveNotes(notes);
  }

  // Quiz question operations
  async getQuizQuestions(folderId: string): Promise<QuizQuestion[]> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.getQuizQuestions(folderId);
  }

  async saveQuizQuestions(folderId: string, questions: QuizQuestion[]): Promise<boolean> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.saveQuizQuestions(folderId, questions);
  }

  // Quiz result operations
  async getQuizResults(folderId: string): Promise<QuizResult[]> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.getQuizResults(folderId);
  }

  async saveQuizResults(folderId: string, results: QuizResult[]): Promise<boolean> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.saveQuizResults(folderId, results);
  }

  // Settings operations
  async getSettings(): Promise<any> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.getSettings();
  }

  async saveSettings(settings: any): Promise<boolean> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.saveSettings(settings);
  }

  // Storage path
  async getStoragePath(): Promise<string> {
    if (!this.isElectron) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI!.getStoragePath();
  }

  // Menu event listeners
  onMenuNewFolder(callback: () => void): void {
    if (!this.isElectron) {
      return;
    }
    window.electronAPI!.onMenuNewFolder(callback);
  }

  onMenuNewNote(callback: () => void): void {
    if (!this.isElectron) {
      return;
    }
    window.electronAPI!.onMenuNewNote(callback);
  }

  onMenuAbout(callback: () => void): void {
    if (!this.isElectron) {
      return;
    }
    window.electronAPI!.onMenuAbout(callback);
  }

  // Cleanup listeners
  removeAllListeners(channel: string): void {
    if (!this.isElectron) {
      return;
    }
    window.electronAPI!.removeAllListeners(channel);
  }

  // Check if running in Electron
  isElectronApp(): boolean {
    return this.isElectron;
  }
}

export const electronDataService = new ElectronDataService();
export default electronDataService; 