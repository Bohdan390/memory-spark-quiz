import { QuizQuestion, Note } from '@/types/models';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

class OllamaService {
  private baseUrl = 'http://localhost:11434';
  private model = 'llama3.1:8b'; // Default model, can be changed

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }

  async generateQuizQuestions(notes: Note[], maxQuestions: number = 10): Promise<QuizQuestion[]> {
    if (!await this.isAvailable()) {
      throw new Error('Ollama is not running. Please install and start Ollama first.');
    }

    const allContent = notes.map(note => `Title: ${note.title}\nContent: ${note.content}`).join('\n\n---\n\n');
    
    if (!allContent.trim()) {
      return [];
    }

    const prompt = this.createQuizPrompt(allContent, maxQuestions);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: OllamaResponse = await response.json();
      return this.parseQuizResponse(data.response, notes);
    } catch (error) {
      console.error('Error generating quiz with Ollama:', error);
      throw new Error('Failed to generate quiz questions with Ollama');
    }
  }

  private createQuizPrompt(content: string, maxQuestions: number): string {
    return `Based on the following notes, create ${maxQuestions} educational quiz questions. 

Format your response as a JSON array with objects containing:
- "question": the question text
- "answer": the correct answer
- "type": either "fillInBlank", "shortAnswer", or "multipleChoice"
- "options": array of 4 options (only for multipleChoice type)

Make the questions test understanding, not just memorization. Focus on key concepts, important facts, and relationships between ideas.

Notes:
${content}

Respond with only the JSON array, no additional text:`;
  }

  private parseQuizResponse(response: string, notes: Note[]): QuizQuestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      
      return questions.map((q: any, index: number) => ({
        id: `ollama-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
        folder_id: '', // Will be set by caller
        note_id: notes[0]?.id || '',
        user_id: '', // Will be set by caller
        question: q.question || '',
        answer: q.answer || '',
        type: this.validateQuestionType(q.type),
        options: q.options || undefined,
        easeFactor: 2.5,
        interval: 1,
        lastReviewed: null,
        nextReviewDate: new Date(),
      }));
    } catch (error) {
      console.error('Error parsing Ollama response:', error);
      // Fallback to simple parsing if JSON parsing fails
      return this.fallbackParsing(response, notes);
    }
  }

  private validateQuestionType(type: string): 'fillInBlank' | 'shortAnswer' | 'multipleChoice' {
    const validTypes = ['fillInBlank', 'shortAnswer', 'multipleChoice'];
    return validTypes.includes(type) ? type as any : 'shortAnswer';
  }

  private fallbackParsing(response: string, notes: Note[]): QuizQuestion[] {
    // Simple fallback parsing if JSON parsing fails
    const lines = response.split('\n').filter(line => line.trim());
    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        questions.push({
          id: `ollama-fallback-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          folder_id: '',
          note_id: notes[0]?.id || '',
          user_id: '',
          question: lines[i].replace(/^\d+\.?\s*/, ''), // Remove numbering
          answer: lines[i + 1].replace(/^A:\s*/, ''), // Remove "A:" prefix
          type: 'shortAnswer',
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: null,
          nextReviewDate: new Date(),
        });
      }
    }
    
    return questions.slice(0, 10);
  }

  setModel(modelName: string) {
    this.model = modelName;
  }

  getModel(): string {
    return this.model;
  }
}

export const ollamaService = new OllamaService(); 