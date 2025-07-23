import OpenAI from 'openai';
import { QuizQuestion, Note } from '@/types/models';
import EnhancedQuizService from './enhancedQuizService';
import MemoryTechniquesService from './memoryTechniquesService';

// For now, we'll use a local implementation since we don't have API keys
// In a real app, you'd initialize with: new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const openai: OpenAI | null = null; // Placeholder for OpenAI client

interface GeneratedQuestion {
  question: string;
  answer: string;
  type: 'multipleChoice' | 'fillInBlank' | 'shortAnswer';
  options?: string[];
}

// Fallback simple quiz generation
function generateSimpleQuiz(notes: Note[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  notes.forEach((note, noteIndex) => {
    if (note.content.trim().length < 50) return;
    
    const sentences = note.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const words = note.content.toLowerCase().split(/\s+/);
    
    // Find key terms
    const keyTerms = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'they', 'them', 'then', 'than', 'when', 'where', 'what', 'which', 'would', 'could', 'should'].includes(word)
    );
    
    // Generate fill-in-blank questions
    sentences.slice(0, 2).forEach((sentence, sentIndex) => {
      const sentenceWords = sentence.trim().split(/\s+/);
      
      if (sentenceWords.length > 5) {
        const importantWordIndex = sentenceWords.findIndex(word => 
          keyTerms.includes(word.toLowerCase().replace(/[^\w]/g, ''))
        );
        
        if (importantWordIndex > 0) {
          const targetWord = sentenceWords[importantWordIndex];
          const questionText = sentenceWords.map((word, i) => 
            i === importantWordIndex ? '____' : word
          ).join(' ');
          
          const now = new Date();
          
          questions.push({
            id: `simple-${Date.now()}-${noteIndex}-${sentIndex}`,
            folder_id: '',
            note_id: note.id,
            user_id: '',
            question: `Fill in the blank: ${questionText.trim()}`,
            answer: targetWord.replace(/[^\w]/g, ''),
            type: 'fillInBlank',
            
            // Enhanced question data
            difficulty: {
              level: 'beginner',
              cognitiveLoad: 'low',
              timeEstimate: 15
            },
            learningMetrics: {
              totalReviews: 0,
              correctStreak: 0,
              longestStreak: 0,
              averageResponseTime: 0,
              difficultyRating: 3,
              retentionRate: 0,
              lastAccuracy: 0
            },
            
            // Spaced repetition
            easeFactor: 2.5,
            interval: 1,
            repetitions: 0,
            lastReviewed: null,
            nextReviewDate: now,
            
            // Advanced features
            stability: 1,
            difficulty_sr: 5,
            retrievability: 0,
            lapses: 0,
            suspended: false,
            buried: false,
            
            // Metadata
            createdAt: now,
            updatedAt: now,
            source: 'generated',
            confidence: 3
          });
        }
      }
    });
  });
  
  return questions.slice(0, 8);
}

export async function generateQuizWithAI(notes: Note[]): Promise<QuizQuestion[]> {
  try {
    // Use the enhanced algorithm for better quality
    const enhancedService = new EnhancedQuizService();
    const questions = await enhancedService.generateEnhancedQuiz(notes);
    
    // Add memory techniques to questions
    return questions.map(question => ({
      ...question,
      mnemonics: MemoryTechniquesService.generateMnemonicsForQuestion(question)
    }));
  } catch (error) {
    console.error('Error generating quiz with enhanced AI:', error);
    
    // Fallback to simple algorithm
    return generateSimpleQuiz(notes);
  }
}

// Future implementation with actual OpenAI API
// Commented out for now - uncomment when you have an OpenAI API key
/*
export const generateQuizWithOpenAI = async (notes: Note[]): Promise<QuizQuestion[]> => {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  const allContent = notes.map(note => `Title: ${note.title}\nContent: ${note.content}`).join('\n\n---\n\n');
  
  const prompt = `Based on the following notes, generate 5-10 educational quiz questions...`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an educational assistant that creates high-quality quiz questions from study notes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    // ... rest of implementation
    return questions;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate questions with AI');
  }
};
*/ 