import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { ArrowLeft } from 'lucide-react';
import QuizCard from '@/components/quiz/QuizCard';
import QuizResults from '@/components/quiz/QuizResults';
import { Skeleton } from '@/components/ui/skeleton';
import { QuizQuestion, QuizResult } from '@/types/models';

const QuizPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { getFolder, generateQuiz, saveQuizResult, isGeneratingQuiz, getQuizes } = useApp();
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResults, setQuizResults] = useState<Partial<QuizResult>>({});
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const folder = getFolder(folderId || '');
  
  useEffect(() => {
    if (!folder) {
      navigate('/folders');
      return;
    } 
    
    if (folder.notes.length === 0) {
      navigate(`/folders/${folderId}`);
      return;
    }

    if (folderId) {
      const quizes = getQuizes(folderId);
      setQuestions(quizes)
      if (quizes.length > 0) setIsLoading(false);
    }
    // loadQuiz();
  }, [folder, folderId, navigate, generateQuiz]);

  if (!folder) {
    return null; // The useEffect will handle navigation
  }
  
  const handleFinishQuiz = (questionResults: {
      questionId: string;
      correct: boolean;
      userAnswer: string;
      responseTime: number;
      confidence: number;
      difficulty: number;
    }[]) => {

    const correctAnswers = questionResults.filter(r => r.correct).length;
    const result: Omit<QuizResult, 'id' | 'user_id'> = {
      folder_id: folderId!,
      correctAnswers,
      totalQuestions: questions.length,
      date: new Date(),
      questionResults
    };
    
    setQuizResults(result);
    saveQuizResult(result);
    setQuizFinished(true);
  };
  
  const onAnswer = () => {

  }
  return (
    <div>
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => navigate(`/folders/${folderId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {folder.name}
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Quiz for {folder.name}
        </h1>
        <p className="text-muted-foreground">
          Test your knowledge on the content in this folder
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        {isLoading || isGeneratingQuiz ? (
          <div className="space-y-8">
            {/* Enhanced Loading State */}
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold animate-pulse">
                  {isGeneratingQuiz ? 'Generating Quiz Questions...' : 'Loading Quiz...'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isGeneratingQuiz ? 'Creating personalized questions from your notes' : 'Preparing your quiz experience'}
                </p>
              </div>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span className="animate-pulse">Loading...</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            {/* Loading Cards */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-lg border border-muted/50 bg-gradient-to-r from-muted/30 to-muted/50 animate-pulse">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-full animate-pulse"></div>
                      <div className="h-4 w-32 bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/40 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/40 rounded animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50 rounded animate-pulse"></div>
                      <div className="h-8 w-20 bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : quizFinished ? (
          <QuizResults
            quizResults={quizResults}
            questions={questions}
            folderId={folder.id}
            retryQuiz = {() => {
              setQuizFinished(false);
            }}
          />
        ) : (
          <QuizCard 
            questions={questions}
            question={questions[0]}
            onFinish={handleFinishQuiz}
            onAnswer={onAnswer}
          />
        )}
      </div>
    </div>
  );
};

export default QuizPage;
