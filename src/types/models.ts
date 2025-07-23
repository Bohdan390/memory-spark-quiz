export type EntryType = 'journal' | 'work';

export interface Category {
  id: string;
  name: string;
  type: EntryType;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  type: EntryType;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastReviewed?: string;
  easeFactor?: number; // For spaced repetition algorithm
}

// Legacy types for backward compatibility
export interface Note {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  lastReviewed?: Date;
  easeFactor?: number; // For spaced repetition algorithm
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  notes: Note[];
  user_id?: string;
}

// Enhanced Question Types inspired by Anki and spaced repetition apps
export type QuestionType = 
  | 'flashcard'           // Basic front/back flashcard
  | 'fillInBlank'         // Fill in the blank
  | 'multipleChoice'      // Multiple choice
  | 'shortAnswer'         // Short answer
  | 'trueFalse'          // True/false
  | 'cloze'              // Cloze deletion (multiple blanks)
  | 'matching'           // Match items from two lists
  | 'ordering'           // Put items in correct order
  | 'imageOcclusion'     // Image with hidden parts (future)
  | 'typing'             // Type the exact answer
  | 'reversedCard'       // Reverse of flashcard (answer -> question)
  | 'explanation'        // Explain a concept in detail
  | 'application'        // Apply knowledge to scenario
  | 'comparison'         // Compare two or more concepts
  | 'definition';        // Define a term

export interface QuestionDifficulty {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  cognitiveLoad: 'low' | 'medium' | 'high';
  timeEstimate: number; // seconds
}

export interface LearningMetrics {
  totalReviews: number;
  correctStreak: number;
  longestStreak: number;
  averageResponseTime: number; // milliseconds
  difficultyRating: number; // 1-5, user-rated difficulty
  retentionRate: number; // percentage of correct answers
  lastAccuracy: number; // accuracy in last 10 reviews
}

export interface QuizQuestion {
  id: string;
  folder_id?: string;
  note_id?: string;
  user_id: string;
  question: string;
  answer: string;
  // Core Question Data
  type: QuestionType;
  
  // Enhanced Question Data
  front?: string;           // For flashcards - front side
  back?: string;            // For flashcards - back side
  hint?: string;            // Optional hint
  explanation?: string;     // Detailed explanation
  options?: string[];       // For multiple choice, matching
  blanks?: string[];        // For cloze deletion
  correctOrder?: string[];  // For ordering questions
  tags?: string[];          // Categorization tags
  
  // Difficulty and Learning
  difficulty: QuestionDifficulty;
  learningMetrics: LearningMetrics;
  
  // Enhanced Spaced Repetition (SM-2 Algorithm + improvements)
  easeFactor: number;       // 1.3 - 3.0, how easy the card is
  interval: number;         // Days until next review
  repetitions: number;      // Number of successful reviews
  lastReviewed: Date | null;
  nextReviewDate: Date;
  
  // Advanced Spaced Repetition Features
  stability: number;        // How stable the memory is (FSRS algorithm)
  difficulty_sr: number;    // Difficulty in spaced repetition context
  retrievability: number;   // How likely to remember (0-1)
  lapses: number;          // Number of times forgotten
  suspended: boolean;       // Temporarily suspended from reviews
  buried: boolean;         // Buried until next day
  
  // Memory Enhancement Features
  memoryPalace?: {
    location: string;
    visualization: string;
    associations: string[];
  };
  mnemonics?: string[];     // Memory aids
  relatedQuestions?: string[]; // IDs of related questions
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'generated' | 'manual' | 'imported';
  confidence: number;       // User's confidence level (1-5)
}

export interface StudySession {
  id: string;
  user_id: string;
  startTime: Date;
  endTime?: Date;
  questionsReviewed: number;
  correctAnswers: number;
  averageResponseTime: number;
  focusTime: number; // Time actually spent (excluding breaks)
  sessionType: 'review' | 'learn' | 'cram' | 'test';
  mood: 'excellent' | 'good' | 'okay' | 'poor' | 'terrible';
  notes?: string;
}

export interface QuizResult {
  folder_id: string;
  user_id: string;
  date: Date;
  correctAnswers: number;
  totalQuestions: number;
  sessionId?: string;
  questionResults: {
    questionId: string;
    correct: boolean;
    userAnswer: string;
    responseTime: number; // milliseconds
    confidence: number;   // 1-5
    difficulty: number;   // 1-5, how hard user found it
  }[];
}

export interface LearningStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  matureCards: number;
  suspendedCards: number;
  
  todayStats: {
    newCardsStudied: number;
    reviewsCompleted: number;
    timeSpent: number; // minutes
    accuracy: number; // percentage
  };
  
  streaks: {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date;
  };
  
  retention: {
    overall: number;
    young: number; // cards with interval < 21 days
    mature: number; // cards with interval >= 21 days
  };
}

// Memory techniques and learning strategies
export interface MemoryTechnique {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  effectiveness: number; // 1-10
  applicableTypes: QuestionType[];
}

export interface LearningGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  targetDate: Date;
  cardsPerDay: number;
  reviewsPerDay: number;
  progress: number; // 0-100
  active: boolean;
}

// Review result for spaced repetition
export interface ReviewResult {
  grade: number; // 1-4 (Again, Hard, Good, Easy)
  responseTime: number; // milliseconds
  confidence: number; // 1-5
  difficulty: number; // 1-5 (user-rated)
}
