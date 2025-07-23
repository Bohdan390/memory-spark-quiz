import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateQuizWithAI } from '@/services/openaiService';
import { Note } from '@/types/models';

const QuizDebug: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testQuizGeneration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create test notes
      const testNotes: Note[] = [
        {
          id: 'test-note-1',
          folder_id: 'test-folder',
          user_id: 'test-user',
          title: 'Machine Learning Basics',
          content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models. Neural networks are computational models inspired by biological neural networks. Deep learning uses multiple layers of neural networks to learn complex patterns.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-note-2',
          folder_id: 'test-folder',
          user_id: 'test-user',
          title: 'Data Science Process',
          content: 'The data science process involves data collection, data cleaning, exploratory data analysis, model building, and model evaluation. First, you collect raw data from various sources. Then, you clean and preprocess the data. Next, you analyze the data to understand patterns. Finally, you build and evaluate predictive models.',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      console.log('Starting quiz generation with test notes:', testNotes);
      
      const generatedQuestions = await generateQuizWithAI(testNotes);
      
      console.log('Generated questions:', generatedQuestions);
      
      setQuestions(generatedQuestions);
      
    } catch (err) {
      console.error('Quiz generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Generation Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testQuizGeneration} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generating Quiz...' : 'Test Quiz Generation'}
            </Button>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="font-semibold text-red-800">Error:</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {questions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Generated Questions ({questions.length}):</h3>
                {questions.map((question, index) => (
                  <Card key={index} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div><strong>ID:</strong> {question.id}</div>
                        <div><strong>Type:</strong> {question.type}</div>
                        <div><strong>Question:</strong> {question.question}</div>
                        <div><strong>Answer:</strong> {question.answer}</div>
                        {question.options && (
                          <div><strong>Options:</strong> {JSON.stringify(question.options)}</div>
                        )}
                        {question.difficulty && (
                          <div><strong>Difficulty:</strong> {JSON.stringify(question.difficulty)}</div>
                        )}
                        {question.explanation && (
                          <div><strong>Explanation:</strong> {question.explanation}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizDebug; 