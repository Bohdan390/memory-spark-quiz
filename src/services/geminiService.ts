import { Note, QuizQuestion } from '@/types/models';
import { v4 as uuidv4 } from 'uuid';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export const generateQuizQuestionsWithGemini = async (notes: Note[]): Promise<QuizQuestion[]> => {
  if (notes.length === 0) return [];
  if (!GEMINI_API_KEY) {
    console.error("VITE_GEMINI_API_KEY is not set in .env file");
    // Potentially show a toast to the user here or return a specific error state
    return Promise.reject(new Error("API key not configured. Please contact support."));
  }

  const noteContents = notes.map(note => ({
    id: note.id,
    title: note.title,
    content: note.content
  }));

  const prompt = `
    Generate quiz questions based on the following notes. For each note, create 1-3 questions. 
    Include a mix of question types: fillInBlank, shortAnswer, multipleChoice, and trueFalse.
    For multiple choice questions, include 3-4 plausible options.
    
    FORMAT YOUR RESPONSE AS JSON with this structure:
    [
      {
        "question": "Question text here",
        "answer": "Correct answer here",
        "noteId": "ID of the source note",
        "type": "fillInBlank | shortAnswer | multipleChoice | trueFalse",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"] // Only for multipleChoice
      }
    ]

    Here are the notes:
    ${JSON.stringify(noteContents)}
  `;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json() as GeminiResponse;
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('No candidates in Gemini response:', data);
      return [];
    }

    const responseText = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON part from the response (in case there's additional text)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from response:', responseText);
      return [];
    }
    
    const jsonString = jsonMatch[0];
    const parsedQuestions = JSON.parse(jsonString) as Omit<QuizQuestion, 'id' | 'lastReviewed' | 'easeFactor' | 'interval' | 'nextReviewDate'>[];
    
    // Convert to our QuizQuestion format and add missing fields
    return parsedQuestions.map(q => ({
      ...q,
      id: uuidv4(),
      easeFactor: 2.5, // Starting ease factor
      interval: 0, // Start with 0 day interval (review immediately)
      lastReviewed: null,
      nextReviewDate: new Date(), // Schedule for review immediately
    }));
  } catch (error) {
    console.error('Error generating quiz questions with Gemini:', error);
    return [];
  }
};
