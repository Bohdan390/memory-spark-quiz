import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { ArrowLeft } from 'lucide-react';
import QuizCard from '@/components/quiz/QuizCard';
import QuizResults from '@/components/quiz/QuizResults';
import { Skeleton } from '@/components/ui/skeleton';
import { QuizQuestion, QuizResult, QuestionResult } from '@/types/models';

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

    const loadQuiz = async () => {
      setIsLoading(true);
      try {
        const quizQuestions = await generateQuiz(folderId || '');
        setQuestions(quizQuestions);
        
        if (quizQuestions.length === 0) {
          navigate(`/folders/${folderId}`);
        }
      } catch (error) {
        console.error('Failed to generate quiz:', error);
      } finally {
        setIsLoading(false);
      }
    };
    // Fix: folderId can be undefined, but getQuizes expects string
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
    quizResults.correctAnswers = correctAnswers;
    quizResults.date = new Date();
    quizResults.folder_id = folderId;
    quizResults.totalQuestions = questions.length;
    quizResults.user_id = questions[0].user_id;
    quizResults.questionResults = questionResults;
    setQuizResults(quizResults);
    
    setQuizFinished(true);
  };
  console.log(questions)
  
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
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="flex justify-between">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
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
            onFinish={handleFinishQuiz}
            folderId={folder.id}
            onAnswer={onAnswer}
          />
        )}
      </div>
    </div>
  );
};

export default QuizPage;
