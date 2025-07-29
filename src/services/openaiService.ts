import OpenAI from 'openai';
import { QuizQuestion, Note } from '@/types/models';
import EnhancedQuizService from './enhancedQuizService';
import MemoryTechniquesService from './memoryTechniquesService';

// Initialize OpenAI client if API key is available
const openai = import.meta.env.VITE_OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Only for demo purposes
    })
  : null;

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
    // If OpenAI is configured, use it
    if (openai) {
      return await generateQuizWithOpenAI(notes);
    }
    
    // Otherwise use the enhanced algorithm
    const enhancedService = new EnhancedQuizService();
    const questions = await enhancedService.generateEnhancedQuiz(notes);
    
    // Add memory techniques to questions
    return questions.map(question => ({
      ...question,
      mnemonics: MemoryTechniquesService.generateMnemonicsForQuestion(question)
    }));
  } catch (error) {
    console.error('Error generating quiz with AI:', error);
    
    // Fallback to simple algorithm
    return generateSimpleQuiz(notes);
  }
}

// Real OpenAI implementation
export const generateQuizWithOpenAI = async (notes: Note[]): Promise<QuizQuestion[]> => {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  const allContent = notes.map(note => `Title: ${note.title}\nContent: ${note.content}`).join('\n\n---\n\n');
  
  const prompt = `Based on the following study notes, generate 8-12 high-quality educational quiz questions. 

Notes:
${allContent}

Requirements:
1. Create a mix of question types: multiple choice (40%), fill-in-the-blank (30%), and short answer (30%)
2. Questions should test understanding, not just memorization
3. Make questions clear and unambiguous
4. For multiple choice, provide 4 options with only one correct answer
5. For fill-in-the-blank, use key terms or concepts
6. For short answer, ask for explanations or definitions

Format your response as JSON:
{
  "questions": [
    {
      "type": "multipleChoice|fillInBlank|shortAnswer",
      "question": "The question text",
      "answer": "The correct answer",
      "options": ["option1", "option2", "option3", "option4"] // only for multiple choice
    }
  ]
}

Generate questions that are educational and help with learning the material.`;

  try {
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educational assistant that creates high-quality quiz questions from study notes. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || "0.7"),
      max_tokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || "1500"),
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(response);
    const questions = parsedResponse.questions || [];

    // Convert to QuizQuestion format
    const now = new Date();
    return questions.map((q: any, index: number) => ({
      id: `openai-${Date.now()}-${index}`,
      folder_id: '',
      note_id: notes[0]?.id || '',
      user_id: '',
      question: q.question,
      answer: q.answer,
      type: q.type,
      options: q.options,
      
      // Enhanced question data
      difficulty: {
        level: 'intermediate',
        cognitiveLoad: 'medium',
        timeEstimate: 30
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
      source: 'openai',
      confidence: 4
    }));

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate questions with OpenAI');
  }
}; 