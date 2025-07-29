import { Folder, Note, QuizQuestion, QuizResult } from '@/types/models';
import { supabase } from '@/lib/supabaseClient';
import electronDataService from './electronDataService';

class HybridDataService {
  private isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Folder operations
  async getFolders(): Promise<Folder[]> {
    if (this.isElectron) {
      return await electronDataService.getFolders();
    } else {
      const { data, error } = await supabase.from('folders').select('*');
      if (error) throw error;
      return data || [];
    }
  }

  async saveFolders(folders: Folder[]): Promise<boolean> {
    if (this.isElectron) {
      return await electronDataService.saveFolders(folders);
    } else {
      const { error } = await supabase.from('folders').upsert(folders);
      if (error) throw error;
      return true;
    }
  }

  async createFolder(folder: Omit<Folder, 'id'>): Promise<Folder> {
    if (this.isElectron) {
      const folders = await this.getFolders();
      const newFolder = { ...folder, id: crypto.randomUUID() };
      folders.push(newFolder);
      await this.saveFolders(folders);
      return newFolder;
    } else {
      const { data, error } = await supabase.from('folders').insert(folder).select().single();
      if (error) throw error;
      return data;
    }
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
    if (this.isElectron) {
      const folders = await this.getFolders();
      const index = folders.findIndex(f => f.id === id);
      if (index !== -1) {
        folders[index] = { ...folders[index], ...updates };
        await this.saveFolders(folders);
      }
    } else {
      const { error } = await supabase.from('folders').update(updates).eq('id', id);
      if (error) throw error;
    }
  }

  async deleteFolder(id: string): Promise<void> {
    if (this.isElectron) {
      const folders = await this.getFolders();
      const filteredFolders = folders.filter(f => f.id !== id);
      await this.saveFolders(filteredFolders);
    } else {
      const { error } = await supabase.from('folders').delete().eq('id', id);
      if (error) throw error;
    }
  }

  // Note operations
  async getNotes(): Promise<Note[]> {
    if (this.isElectron) {
      return await electronDataService.getNotes();
    } else {
      const { data, error } = await supabase.from('notes').select('*');
      if (error) throw error;
      return data || [];
    }
  }

  async saveNotes(notes: Note[]): Promise<boolean> {
    if (this.isElectron) {
      return await electronDataService.saveNotes(notes);
    } else {
      const { error } = await supabase.from('notes').upsert(notes);
      if (error) throw error;
      return true;
    }
  }

  async createNote(note: Omit<Note, 'id'>): Promise<Note> {
    if (this.isElectron) {
      const notes = await this.getNotes();
      const newNote = { ...note, id: crypto.randomUUID() };
      notes.push(newNote);
      await this.saveNotes(notes);
      return newNote;
    } else {
      const { data, error } = await supabase.from('notes').insert(note).select().single();
      if (error) throw error;
      return data;
    }
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    if (this.isElectron) {
      const notes = await this.getNotes();
      const index = notes.findIndex(n => n.id === id);
      if (index !== -1) {
        notes[index] = { ...notes[index], ...updates };
        await this.saveNotes(notes);
      }
    } else {
      const { error } = await supabase.from('notes').update(updates).eq('id', id);
      if (error) throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    if (this.isElectron) {
      const notes = await this.getNotes();
      const filteredNotes = notes.filter(n => n.id !== id);
      await this.saveNotes(filteredNotes);
    } else {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    }
  }

  // Quiz question operations
  async getQuizQuestions(folderId: string): Promise<QuizQuestion[]> {
    if (this.isElectron) {
      return await electronDataService.getQuizQuestions(folderId);
    } else {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('folder_id', folderId);
      if (error) throw error;
      return data || [];
    }
  }

  async saveQuizQuestions(folderId: string, questions: QuizQuestion[]): Promise<boolean> {
    if (this.isElectron) {
      return await electronDataService.saveQuizQuestions(folderId, questions);
    } else {
      // Delete existing questions for this folder
      await supabase.from('quiz_questions').delete().eq('folder_id', folderId);
      
      // Insert new questions
      if (questions.length > 0) {
        const { error } = await supabase.from('quiz_questions').insert(questions);
        if (error) throw error;
      }
      return true;
    }
  }

  async createQuizQuestion(question: Omit<QuizQuestion, 'id'>): Promise<QuizQuestion> {
    if (this.isElectron) {
      const questions = await this.getQuizQuestions(question.folder_id);
      const newQuestion = { ...question, id: crypto.randomUUID() };
      questions.push(newQuestion);
      await this.saveQuizQuestions(question.folder_id, questions);
      return newQuestion;
    } else {
      const { data, error } = await supabase.from('quiz_questions').insert(question).select().single();
      if (error) throw error;
      return data;
    }
  }

  async updateQuizQuestion(id: string, updates: Partial<QuizQuestion>): Promise<void> {
    if (this.isElectron) {
      // For Electron, we need to find the folder_id first
      const allQuestions = await this.getAllQuizQuestions();
      const question = allQuestions.find(q => q.id === id);
      if (question) {
        const questions = await this.getQuizQuestions(question.folder_id);
        const index = questions.findIndex(q => q.id === id);
        if (index !== -1) {
          questions[index] = { ...questions[index], ...updates };
          await this.saveQuizQuestions(question.folder_id, questions);
        }
      }
    } else {
      const { error } = await supabase.from('quiz_questions').update(updates).eq('id', id);
      if (error) throw error;
    }
  }

  async deleteQuizQuestion(id: string): Promise<void> {
    if (this.isElectron) {
      const allQuestions = await this.getAllQuizQuestions();
      const question = allQuestions.find(q => q.id === id);
      if (question) {
        const questions = await this.getQuizQuestions(question.folder_id);
        const filteredQuestions = questions.filter(q => q.id !== id);
        await this.saveQuizQuestions(question.folder_id, filteredQuestions);
      }
    } else {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    }
  }

  // Helper method for Electron to get all questions across folders
  private async getAllQuizQuestions(): Promise<QuizQuestion[]> {
    if (this.isElectron) {
      const folders = await this.getFolders();
      const allQuestions: QuizQuestion[] = [];
      for (const folder of folders) {
        const questions = await this.getQuizQuestions(folder.id);
        allQuestions.push(...questions);
      }
      return allQuestions;
    } else {
      const { data, error } = await supabase.from('quiz_questions').select('*');
      if (error) throw error;
      return data || [];
    }
  }

  // Quiz result operations
  async getQuizResults(folderId: string): Promise<QuizResult[]> {
    if (this.isElectron) {
      return await electronDataService.getQuizResults(folderId);
    } else {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('folder_id', folderId);
      if (error) throw error;
      return data || [];
    }
  }

  async saveQuizResults(folderId: string, results: QuizResult[]): Promise<boolean> {
    if (this.isElectron) {
      return await electronDataService.saveQuizResults(folderId, results);
    } else {
      const { error } = await supabase.from('quiz_results').upsert(results);
      if (error) throw error;
      return true;
    }
  }

  async createQuizResult(result: Omit<QuizResult, 'id'>): Promise<QuizResult> {
    if (this.isElectron) {
      const results = await this.getQuizResults(result.folder_id);
      const newResult = { ...result, id: crypto.randomUUID() };
      results.push(newResult);
      await this.saveQuizResults(result.folder_id, results);
      return newResult;
    } else {
      const { data, error } = await supabase.from('quiz_results').insert(result).select().single();
      if (error) throw error;
      return data;
    }
  }

  // Settings operations
  async getSettings(): Promise<any> {
    if (this.isElectron) {
      return await electronDataService.getSettings();
    } else {
      // For web, use localStorage for settings
      const settings = localStorage.getItem('memoquiz-settings');
      return settings ? JSON.parse(settings) : {
        theme: 'system',
        autoSave: true,
        notifications: true,
        studyReminders: true,
        defaultQuizLength: 10,
        spacedRepetition: true
      };
    }
  }

  async saveSettings(settings: any): Promise<boolean> {
    if (this.isElectron) {
      return await electronDataService.saveSettings(settings);
    } else {
      localStorage.setItem('memoquiz-settings', JSON.stringify(settings));
      return true;
    }
  }

  // Check if running in Electron
  isElectronApp(): boolean {
    return this.isElectron;
  }

  // Get storage path (Electron only)
  async getStoragePath(): Promise<string> {
    if (this.isElectron) {
      return await electronDataService.getStoragePath();
    } else {
      return 'Browser localStorage';
    }
  }

  // Menu event listeners (Electron only)
  onMenuNewFolder(callback: () => void): void {
    if (this.isElectron) {
      electronDataService.onMenuNewFolder(callback);
    }
  }

  onMenuNewNote(callback: () => void): void {
    if (this.isElectron) {
      electronDataService.onMenuNewNote(callback);
    }
  }

  onMenuAbout(callback: () => void): void {
    if (this.isElectron) {
      electronDataService.onMenuAbout(callback);
    }
  }

  // Cleanup listeners (Electron only)
  removeAllListeners(channel: string): void {
    if (this.isElectron) {
      electronDataService.removeAllListeners(channel);
    }
  }
}

export const hybridDataService = new HybridDataService();
export default hybridDataService; 