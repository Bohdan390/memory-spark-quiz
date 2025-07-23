import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Folder, Note, QuizQuestion, QuizResult, Category, Entry, EntryType, QuestionDifficulty } from '@/types/models';
import { calculateNextReview } from '@/services/spacedRepetitionService';
import { supabase } from '@/lib/supabaseClient';

interface AppContextType {
  // Legacy folder/note system
  folders: Folder[];
  currentFolder: Folder | null;
  currentNote: Note | null;
  currentQuiz: QuizQuestion[] | null;
  quizResults: QuizResult[];
  isLoadingData: boolean;
  
  createFolder: (name: string, description?: string) => Promise<Folder | null>;
  getFolder: (id: string) => Folder | undefined;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  setCurrentFolder: (folder: Folder | null) => void;
  
  createNote: (folderId: string, title: string, content: string) => Promise<Note | null>;
  getNote: (folderId: string, noteId: string) => Note | undefined;
  updateNote: (folderId: string, noteId: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (folderId: string, noteId: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  
  generateQuiz: (folderId: string) => Promise<QuizQuestion[]>;
  saveQuizResult: (result: Omit<QuizResult, 'id' | 'user_id'>) => Promise<void>;
  updateQuestionSpacedRepetitionData: (folderId: string, questionId: string, correct: boolean) => Promise<void>;
  isGeneratingQuiz: boolean;
  
  // Quiz management functions
  getFolderQuestions: (folderId: string) => QuizQuestion[];
  updateQuestion: (questionId: string, data: Partial<QuizQuestion>) => Promise<void>;
  createQuestion: (folderId: string, data: QuizQuestion) => Promise<void>;
  deleteQuestion: (questionId: string) => void;
  addQuestion: (folderId: string, question: Omit<QuizQuestion, 'id' | 'user_id'>) => QuizQuestion;

  // New category/entry system
  categories: Category[];
  entries: Entry[];
  currentCategory: Category | null;
  currentEntry: Entry | null;
  
  createCategory: (name: string, type: EntryType, description?: string) => Promise<Category | null>;
  getCategory: (id: string) => Category | undefined;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setCurrentCategory: (category: Category | null) => void;
  
  createEntry: (categoryId: string, title: string, content: string, type: EntryType) => Promise<Entry | null>;
  getEntry: (categoryId: string, entryId: string) => Entry | undefined;
  updateEntry: (categoryId: string, entryId: string, data: Partial<Entry>) => Promise<void>;
  deleteEntry: (categoryId: string, entryId: string) => Promise<void>;
  setCurrentEntry: (entry: Entry | null) => void;

  getQuizes: (folderId: string) => QuizQuestion[];
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [folderQuestions, setFolderQuestions] = useState<QuizQuestion | null>(null);
  
  // New category/entry state
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  
  const { toast } = useToast();

  // Mock user ID for local storage
  const MOCK_USER_ID = 'local-user-123';

  // Load data from localStorage on app start
  const loadLocalData = useCallback(async () => {
    try {
      const folderResults = await supabase
      .from('folders')
      .select('*');

      const savedFolders = folderResults.data;
      // const savedFolders = localStorage.getItem('memoquiz-folders');
      // const savedQuizResults = localStorage.getItem('memoquiz-quiz-results');
      const quizQuestions = await supabase
      .from('quiz_questions')
      .select('*');

      const noteResults = await supabase
      .from('notes')
      .select('*');

      const saveNotes = noteResults.data

      const saveQuizQuestions = quizQuestions.data
      // Removed broken supabase code; setQuestions is not defined and supabase call is not awaited.
      // If you want to load quiz questions from localStorage, you could do it here.
      if (savedFolders) {
        const parsedFolders = savedFolders.map((f: any) => {
          var notes = saveNotes?.filter(_n => _n.folder_id == f.id);
          return {
            ...f,
            createdAt: new Date(f.createdAt),
            updatedAt: new Date(f.updatedAt),
            notes: (notes || []).map((n: any) => ({
              ...n,
              createdAt: new Date(n.createdAt),
              updatedAt: new Date(n.updatedAt),
              lastReviewed: n.lastReviewed ? new Date(n.lastReviewed) : undefined,
            })),
          }
        });
        setFolders(parsedFolders);
      }

      if (saveQuizQuestions) {
        const parsedQuestions = saveQuizQuestions.map((r: any) => ({
          ...r,
        }));
        setQuizQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error('Error loading local data:', error);
      setFolders([]);
      setQuizQuestions([]);
    }
  }, []);

  // Save data to localStorage whenever folders change
  const saveLocalData = useCallback((foldersData: Folder[]) => {
    try {
      localStorage.setItem('memoquiz-folders', JSON.stringify(foldersData));
    } catch (error) {
      console.error('Error saving local data:', error);
    }
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  useEffect(() => {
    saveLocalData(folders);
  }, [folders, saveLocalData]);

  // --- FOLDER CRUD WITH SUPABASE ---
  const createFolder = async (name: string, description?: string): Promise<Folder | null> => {
    try {
      const newFolder = {
        name,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user_id: MOCK_USER_ID,
      };
      const { data, error } = await supabase
        .from('folders')
        .insert([newFolder])
        .select();
      if (error) throw error;
      const folder: Folder = {
        ...data[0],
        notes: [],
        createdAt: new Date(data[0].createdAt),
        updatedAt: new Date(data[0].updatedAt),
      };
      console.log(folder);
      setFolders(prev => [folder, ...prev]);
      toast({ title: 'Folder created', description: `Folder "${name}" created successfully.` });
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({ title: 'Error', description: 'Failed to create folder. Please try again.', variant: 'destructive' });
      return null;
    }
  };

  const getQuizes = (folderId: string) => quizQuestions.filter(_q => _q.folder_id === folderId)

  const getFolder = (id: string) => folders.find(folder => folder.id === id);

  const updateFolder = async (id: string, data: Partial<Folder>) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder.id === id ? { ...folder, ...data, updatedAt: new Date() } : folder
        )
      );
      setCurrentFolder(prevCurrentFolder =>
        prevCurrentFolder && prevCurrentFolder.id === id
          ? { ...prevCurrentFolder, ...data, updatedAt: new Date() }
          : prevCurrentFolder
      );
      toast({ title: 'Folder updated', description: `Folder "${data.name || 'updated'}" has been updated successfully.` });
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({ title: 'Error', description: 'Failed to update folder. Please try again.', variant: 'destructive' });
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setFolders(prevFolders => prevFolders.filter(folder => folder.id !== id));
      if (currentFolder && currentFolder.id === id) setCurrentFolder(null);
      if (currentNote && currentNote.folder_id === id) setCurrentNote(null);
      toast({ title: 'Folder deleted', description: `Folder and all its notes have been deleted successfully.` });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({ title: 'Error', description: 'Failed to delete folder. Please try again.', variant: 'destructive' });
    }
  };

  // --- NOTE CRUD WITH SUPABASE ---
  const createNote = async (folderId: string, title: string, content: string): Promise<Note | null> => {
    if (!folderId) {
      toast({ title: 'Folder not specified', description: 'A folder must be selected to create a note.', variant: 'destructive' });
      return null;
    }
    try {
      const newNote = {
        folder_id: folderId,
        user_id: MOCK_USER_ID,
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('notes')
        .insert([newNote])
        .select();
      if (error) throw error;
      const note: Note = {
        ...data[0],
        createdAt: new Date(data[0].createdAt),
        updatedAt: new Date(data[0].updatedAt),
      };
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder.id === folderId
            ? { ...folder, notes: [...(folder.notes || []), note] }
            : folder
        )
      );
      setCurrentFolder(prevCurrentFolder =>
        prevCurrentFolder && prevCurrentFolder.id === folderId
          ? { ...prevCurrentFolder, notes: [...(prevCurrentFolder.notes || []), note] }
          : prevCurrentFolder
      );
      toast({ title: 'Note created', description: `Note "${title}" created successfully.` });
      return note;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({ title: 'Error', description: 'Failed to create note. Please try again.', variant: 'destructive' });
      return null;
    }
  };

  const getNote = (folderId: string, noteId: string): Note | undefined => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return undefined;
    return folder.notes.find(n => n.id === noteId);
  };

  const updateNote = async (folderId: string, noteId: string, data: Partial<Note>) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq('id', noteId);
      if (error) throw error;
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder.id === folderId
            ? {
                ...folder,
                notes: folder.notes.map(note =>
                  note.id === noteId ? { ...note, ...data, updatedAt: new Date() } : note
                ),
              }
            : folder
        )
      );
      setCurrentFolder(prevCurrentFolder =>
        prevCurrentFolder && prevCurrentFolder.id === folderId
          ? {
              ...prevCurrentFolder,
              notes: prevCurrentFolder.notes.map(note =>
                note.id === noteId ? { ...note, ...data, updatedAt: new Date() } : note
              ),
            }
          : prevCurrentFolder
      );
      setCurrentNote(prevCurrentNote =>
        prevCurrentNote && prevCurrentNote.id === noteId
          ? { ...prevCurrentNote, ...data, updatedAt: new Date() }
          : prevCurrentNote
      );
      toast({ title: 'Note updated', description: `Note "${data.title || 'updated'}" has been updated successfully.` });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({ title: 'Error', description: 'Failed to update note. Please try again.', variant: 'destructive' });
    }
  };

  const deleteNote = async (folderId: string, noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder.id === folderId
            ? { ...folder, notes: folder.notes.filter(note => note.id !== noteId) }
            : folder
        )
      );
      if (currentNote && currentNote.id === noteId) setCurrentNote(null);
      toast({ title: 'Note deleted', description: 'Note has been deleted successfully.' });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({ title: 'Error', description: 'Failed to delete note. Please try again.', variant: 'destructive' });
    }
  };

  const generateQuiz = async (folderId: string): Promise<QuizQuestion[]> => {
    setIsGeneratingQuiz(true);
    try {
      const folder = folders.find(f => f.id === folderId);
      
      if (!folder || !folder.notes.length) {
        toast({ 
          title: 'No content to quiz', 
          description: 'This folder has no notes to generate quiz questions from.', 
          variant: 'destructive' 
        });
        return [];
      }
      await supabase.from('quiz_questions').delete().eq('folder_id', folderId);
      const noteContents = folder.notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content
      }));

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: 
              `
                You are a quiz generator. For each journal entry below, create 3 multiple-choice questions with 4 options. Format each as a JSON array of objects, where each object has the following fields:
                {
                  "question": "Question text",
                  "answer": "Correct answer",
                  "hint": "Hint (optional)",
                  "noteId": "ID of the source note",
                  "type": "multipleChoice",
                  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                  "front": "Question text (same as question)",
                  "back": "Correct answer (same as answer)",
                  "tags": ["tag1", "tag2", "type"],
                  "explanation": "Detailed explanation (optional)",
                  "blanks": [],
                  "correctOrder": [],
                  "memoryPalace": { "location": "", "visualization": "", "associations": [] },
                  "mnemonics": [],
                  "relatedQuestions": []
                }
                Do not include fields like learningMetrics, difficulty, or spaced repetition fields; these will be filled by the app. Output only a JSON array of such objects.
                Journals:
                "${JSON.stringify(noteContents)}"
              `
            },
            {
              role: "user",
              content: JSON.stringify(noteContents)
            }
          ]
        })
      });
      setIsGeneratingQuiz(false);
      const data = await res.json();
      const cleaned = data.choices[0].message.content
        .replace(/```json|```js|```/gi, '') // Remove code block markers
        .trim();
      // Parse the cleaned JSON string
      const questions = JSON.parse(cleaned);
      // Add folder_id, user_id, and all required QuizQuestion fields to each question, and add Anki-compatible fields
      const now = new Date();
      const questionsWithMeta = questions.map((q: any) => {
        // id is omitted so Supabase can auto-generate it
        let options = Array.isArray(q.options) ? [...q.options] : [];
        const answer = typeof q.back === 'string' ? q.back : 'No answer';
        // Ensure answer is in options for multipleChoice
        if (q.type === 'multipleChoice' && !options.includes(answer)) {
          options.push(answer);
          options = options.sort(() => Math.random() - 0.5);
        }
        return {
          question: q.question,
          answer: q.answer,
          front: typeof q.front === 'string' ? q.front : 'No question',
          back: answer,
          note_id: q.noteId,
          type: q.type,
          options,
          folder_id: folderId,
          user_id: MOCK_USER_ID,
          tags: getTagsForQuestion(q),
          hint: q.hint || '',
          explanation: q.explanation || '',
          blanks: q.blanks || [],
          correctOrder: q.correctOrder || [],
          difficulty: getDifficultyForQuestion(q),
          learningMetrics: {
            totalReviews: 0,
            correctStreak: 0,
            longestStreak: 0,
            averageResponseTime: 0,
            difficultyRating: 1,
            retentionRate: 0,
            lastAccuracy: 0
          },
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          lastReviewed: now,
          nextReviewDate: now,
          stability: 0,
          difficulty_sr: 0,
          retrievability: 1,
          lapses: 0,
          suspended: false,
          buried: false,
          memoryPalace: q.memoryPalace || undefined,
          mnemonics: q.mnemonics || [],
          relatedQuestions: q.relatedQuestions || [],
          createdAt: now,
          updatedAt: now,
          source: 'generated',
          confidence: 3
        };
      });
      setQuizQuestions(questionsWithMeta);
      // Save to Supabase (use upsert to avoid 409 conflict)
      const { error } = await supabase
        .from('quiz_questions')
        .upsert(questionsWithMeta);
      if (error) {
        toast({ title: 'Error saving quiz questions', description: error.message, variant: 'destructive' });
        return [];
      }
      setCurrentQuiz(questionsWithMeta);
      toast({ title: 'Quiz generated', description: `Generated and saved ${questionsWithMeta.length} questions for review.` });
      return questionsWithMeta;
    } catch (error) {
      setIsGeneratingQuiz(false);
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz questions.';
      toast({ 
        title: 'Error generating quiz', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      return [];
    }
  };

  const saveQuizResult = async (result: Omit<QuizResult, 'id' | 'user_id'>) => {
    try {
      const newResult: QuizResult = {
        ...result,
        date: new Date(),
        user_id: MOCK_USER_ID,
      };

      quizResults.push(newResult);
      // Save to local state first (immediate UI update)
      setQuizResults(prev => prev); // No-op, or update another state if needed

      // Save to Supabase
      console.log('Saving quiz result to Supabase:', newResult);
      const { error } = await supabase
        .from('quiz_results')
        .insert({
          folder_id: newResult.folder_id,
          user_id: newResult.user_id,
          date: newResult.date.toISOString(),
          correctAnswers: newResult.correctAnswers,
          totalQuestions: newResult.totalQuestions,
          questionResults: newResult.questionResults || []
        });

      if (error) {
        console.error('Error saving quiz result to Supabase:', error);
        throw error;
      }

      console.log('Quiz result saved successfully to Supabase');
      
      toast({ 
        title: 'Quiz completed', 
        description: `Score: ${result.correctAnswers}/${result.totalQuestions} (${Math.round(result.correctAnswers / result.totalQuestions * 100)}%)` 
      });
    } catch (error) {
      console.error('Error saving quiz result:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save quiz results.';
      toast({ 
        title: 'Error saving results', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const updateQuestionSpacedRepetitionData = async (folderId: string, questionId: string, correct: boolean) => {
    try {
      // For local storage, we could save this data, but for simplicity we'll just log it
      const performanceRating = correct ? 1 : 0;
      const mockQuestion: QuizQuestion = {
        id: questionId,
        folder_id: folderId,
        note_id: '',
        user_id: MOCK_USER_ID,
        question: '',
        answer: '',
        type: 'fillInBlank',
        easeFactor: 2.5,
        interval: 1,
        lastReviewed: new Date(),
        nextReviewDate: new Date(),
      };
      
      const { easeFactor, interval } = calculateNextReview(mockQuestion, performanceRating);
      
      console.log(`Updated spaced repetition data for question ${questionId}: correct=${correct}, newInterval=${interval}, newEaseFactor=${easeFactor}`);
    } catch (error) {
      console.error('Error updating question spaced repetition data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update question data.';
      toast({ 
        title: 'Error updating question', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };



  // Quiz management functions
  const getFolderQuestions = (folderId: string): QuizQuestion[] => {
    return quizQuestions.map((q: any) => ({
      ...q,
      nextReviewDate: new Date(q.nextReviewDate),
      lastReviewed: q.lastReviewed ? new Date(q.lastReviewed) : null,
    }));
  };

  const createQuestion = async (folderId: string, data: QuizQuestion): Promise<void> => {
    // Ensure all required fields for QuizQuestion are present and not undefined
    console.log('Creating question in Supabase:', data);
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .insert([{...data, id: undefined, folder_id: folderId}]);

      if (error) {
        console.error('Error creating question in Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to create question in Supabase:', error);
    }

    const questions = getFolderQuestions(folderId);
    const updatedQuestions = [...questions, data];
    setQuizQuestions(updatedQuestions);
    // Update current quiz if it's loaded
    if (currentQuiz) {
      setCurrentQuiz([...currentQuiz, data]);
    }
  }

  const updateQuestion = async (questionId: string, data: Partial<QuizQuestion>): Promise<void> => {
    // Find which folder this question belongs to
    const allFolders = folders;
    let targetFolderId = '';
    for (const folder of allFolders) {
      const questions = getFolderQuestions(folder.id);
      if (questions.find(q => q.id === questionId)) {
        targetFolderId = folder.id;
        break;
      }
    }
    
    if (!targetFolderId) return;
    
    const questions = getFolderQuestions(targetFolderId);
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, ...data, updatedAt: new Date() } : q
    );
    

    setQuizQuestions(updatedQuestions);
    // Update current quiz if it's loaded
    if (currentQuiz) {
      setCurrentQuiz(currentQuiz.map(q => 
        q.id === questionId ? { ...q, ...data, updatedAt: new Date() } : q
      ));
    }

    // Save to Supabase
    console.log('Updating question in Supabase:', data);
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .update({
          ...data,
          updatedAt: new Date().toISOString()
        })
        .eq('id', questionId);

      if (error) {
        console.error('Error updating question in Supabase:', error);
        throw error;
      }
      
      console.log('Question updated successfully in Supabase');
    } catch (error) {
      console.error('Failed to update question in Supabase:', error);
    }
  };

  const deleteQuestion = (questionId: string): void => {
    // Find which folder this question belongs to
    const allFolders = folders;
    let targetFolderId = '';
    
    for (const folder of allFolders) {
      const questions = getFolderQuestions(folder.id);
      if (questions.find(q => q.id === questionId)) {
        targetFolderId = folder.id;
        break;
      }
    }
    
    if (!targetFolderId) return;
    
    const questions = getFolderQuestions(targetFolderId);
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    
    localStorage.setItem(`quiz-questions-${targetFolderId}`, JSON.stringify(updatedQuestions));
    
    // Update current quiz if it's loaded
    if (currentQuiz) {
      setCurrentQuiz(currentQuiz.filter(q => q.id !== questionId));
    }
  };

  const addQuestion = (folderId: string, question: Omit<QuizQuestion, 'id' | 'user_id'>): QuizQuestion => {
    const newQuestion: QuizQuestion = {
      ...question,
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: 'local-user-123',
    };
    
    const questions = getFolderQuestions(folderId);
    const updatedQuestions = [...questions, newQuestion];
    
    localStorage.setItem(`quiz-questions-${folderId}`, JSON.stringify(updatedQuestions));
    
    // Update current quiz if it's loaded for this folder
    if (currentQuiz && currentFolder?.id === folderId) {
      setCurrentQuiz([...currentQuiz, newQuestion]);
    }
    
    return newQuestion;
  };

  // Utility: Determine difficulty for a question
  function getDifficultyForQuestion(q: any): QuestionDifficulty {
    // Example logic: adjust based on type, options, or keywords
    if (q.type === 'multipleChoice' && q.options && q.options.length > 2) {
      return { level: 'beginner', cognitiveLoad: 'low', timeEstimate: 30 };
    }
    if (q.type === 'fillInBlank') {
      return { level: 'intermediate', cognitiveLoad: 'medium', timeEstimate: 45 };
    }
    if (q.type === 'cloze') {
      return { level: 'advanced', cognitiveLoad: 'high', timeEstimate: 60 };
    }
    // Fallback
    return { level: 'beginner', cognitiveLoad: 'low', timeEstimate: 30 };
  }

  // Utility: Generate tags for a question
  function getTagsForQuestion(q: any): string[] {
    const tags: string[] = [];
    if (q.type) tags.push(q.type);
    if (q.topic) tags.push(q.topic);
    if (q.options && Array.isArray(q.options)) {
      tags.push(...q.options.filter((opt: string) => typeof opt === 'string' && opt.length < 20));
    }
    // Add more logic as needed (e.g., keywords in question)
    return tags;
  }

  const value: AppContextType = {
    folders,
    currentFolder,
    currentNote,
    currentQuiz,
    quizResults,
    isLoadingData,
    createFolder,
    getFolder,
    getQuizes,
    updateFolder,
    deleteFolder,
    setCurrentFolder,
    createNote,
    getNote,
    updateNote,
    deleteNote,
    setCurrentNote,
    generateQuiz,
    saveQuizResult,
    updateQuestionSpacedRepetitionData,
    isGeneratingQuiz,
    // Quiz management functions
    getFolderQuestions,
    updateQuestion,
    createQuestion,
    deleteQuestion,
    addQuestion,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
