import { Category, Entry, QuizQuestion, QuizResult } from '../types/models';
import { supabase } from '@/lib/supabaseClient';

class ElectronDataService {
  private isElectron = typeof window !== 'undefined' && window.electronAPI;

  // --- Supabase Methods ---
  // Categories
  async saveCategoriesToSupabase(categories: Category[]): Promise<void> {
    await supabase.from('categories').upsert(categories);
  }
  async loadCategoriesFromSupabase(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return data || [];
  }

  // Entries
  async saveEntriesToSupabase(entries: Entry[]): Promise<void> {
    await supabase.from('entries').upsert(entries);
  }
  async loadEntriesFromSupabase(): Promise<Entry[]> {
    const { data, error } = await supabase.from('entries').select('*');
    if (error) throw error;
    return data || [];
  }

  // Quiz Questions
  async saveQuizQuestionsToSupabase(questions: QuizQuestion[]): Promise<void> {
    await supabase.from('quiz_questions').upsert(questions);
  }
  async loadQuizQuestionsFromSupabase(): Promise<QuizQuestion[]> {
    const { data, error } = await supabase.from('quiz_questions').select('*');
    if (error) throw error;
    return data || [];
  }

  // Quiz Results
  async saveQuizResultsToSupabase(results: QuizResult[]): Promise<void> {
    await supabase.from('quiz_results').upsert(results);
  }
  async loadQuizResultsFromSupabase(): Promise<QuizResult[]> {
    const { data, error } = await supabase.from('quiz_results').select('*');
    if (error) throw error;
    return data || [];
  }

  // --- Existing Electron/LocalStorage Methods ---
  // Categories (replacing folders)
  async saveCategories(categories: Category[]): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.saveData('categories.json', categories);
    } else {
      localStorage.setItem('categories', JSON.stringify(categories));
    }
  }

  async loadCategories(): Promise<Category[]> {
    if (this.isElectron) {
      const result = await window.electronAPI.loadData('categories.json');
      return result.data || [];
    } else {
      const data = localStorage.getItem('categories');
      return data ? JSON.parse(data) : [];
    }
  }

  // Entries (replacing notes)
  async saveEntries(entries: Entry[]): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.saveData('entries.json', entries);
    } else {
      localStorage.setItem('entries', JSON.stringify(entries));
    }
  }

  async loadEntries(): Promise<Entry[]> {
    if (this.isElectron) {
      const result = await window.electronAPI.loadData('entries.json');
      return result.data || [];
    } else {
      const data = localStorage.getItem('entries');
      return data ? JSON.parse(data) : [];
    }
  }

  // Quiz Questions
  async saveQuizQuestions(questions: QuizQuestion[]): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.saveData('quiz_questions.json', questions);
    } else {
      localStorage.setItem('quiz_questions', JSON.stringify(questions));
    }
  }

  async loadQuizQuestions(): Promise<QuizQuestion[]> {
    if (this.isElectron) {
      const result = await window.electronAPI.loadData('quiz_questions.json');
      return result.data || [];
    } else {
      const data = localStorage.getItem('quiz_questions');
      return data ? JSON.parse(data) : [];
    }
  }

  // Quiz Results
  async saveQuizResults(results: QuizResult[]): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.saveData('quiz_results.json', results);
    } else {
      localStorage.setItem('quiz_results', JSON.stringify(results));
    }
  }

  async loadQuizResults(): Promise<QuizResult[]> {
    if (this.isElectron) {
      const result = await window.electronAPI.loadData('quiz_results.json');
      return result.data || [];
    } else {
      const data = localStorage.getItem('quiz_results');
      return data ? JSON.parse(data) : [];
    }
  }

  // Export functionality
  async exportData(): Promise<void> {
    if (this.isElectron) {
      const categories = await this.loadCategories();
      const entries = await this.loadEntries();
      const questions = await this.loadQuizQuestions();
      const results = await this.loadQuizResults();
      
      const exportData = {
        categories,
        entries,
        questions,
        results,
        exportDate: new Date().toISOString()
      };

      const result = await window.electronAPI.showSaveDialog();
      if (!result.canceled && result.filePath) {
        await window.electronAPI.saveData(result.filePath, exportData);
      }
    }
  }

  // Import functionality
  async importData(): Promise<boolean> {
    if (this.isElectron) {
      const result = await window.electronAPI.showOpenDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        const importedData = await window.electronAPI.loadData(result.filePaths[0]);
        if (importedData.success && importedData.data) {
          const data = importedData.data;
          if (data.categories) await this.saveCategories(data.categories);
          if (data.entries) await this.saveEntries(data.entries);
          if (data.questions) await this.saveQuizQuestions(data.questions);
          if (data.results) await this.saveQuizResults(data.results);
          return true;
        }
      }
    }
    return false;
  }

  async getDataPath(): Promise<string> {
    if (this.isElectron) {
      return await window.electronAPI.getDataPath();
    }
    return 'Browser localStorage';
  }
}

export const electronDataService = new ElectronDataService(); 