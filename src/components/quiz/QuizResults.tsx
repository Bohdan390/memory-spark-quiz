
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { QuizQuestion, QuizResult } from '@/types/models';

interface QuizResultsProps {
  quizResults: Partial<QuizResult>;
  questions: QuizQuestion [];
  folderId: string;
  retryQuiz: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ quizResults, questions, folderId, retryQuiz }) => {
  const navigate = useNavigate();

  const correctAnswers = typeof quizResults.correctAnswers === 'number' ? quizResults.correctAnswers : 0;
  const totalQuestions = typeof quizResults.totalQuestions === 'number' ? quizResults.totalQuestions : 0;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const getMessage = () => {
    if (percentage >= 90) {
      return "Excellent! You've mastered this material.";
    } else if (percentage >= 70) {
      return "Good job! You're on the right track.";
    } else if (percentage >= 50) {
      return "Not bad, but there's room for improvement.";
    } else {
      return "You might need to review this material more carefully.";
    }
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Quiz Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl font-bold">
            {percentage}%
          </div>
          
          <div className="flex gap-2 text-lg">
            <span className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="mr-1 h-5 w-5" /> {quizResults.correctAnswers}
            </span>
            {" / "}
            <span className="flex items-center text-red-600 dark:text-red-400">
              <XCircle className="mr-1 h-5 w-5" /> {totalQuestions - correctAnswers}
            </span>
          </div>
          
          <p className="text-center text-muted-foreground mt-4">
            {getMessage()}
          </p>
        </div>
        <div className="inset-0 bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xl">
              <div className="space-y-4 max-h-72 overflow-y-auto">
                {quizResults?.questionResults?.map((q, index) => {
                  const qData = questions.find(question => question.id === q.questionId);
                  return (
                    <div key={q.questionId} className="p-3 rounded-md border">
                      <p className="font-medium">
                        Q{index + 1}: {qData?.front || "Unknown question"}
                      </p>
                      {q.correct ? (
                        <p className="text-green-600">✅ Correct</p>
                      ) : (
                        <div className="text-red-600">
                          ❌ Incorrect
                          <p className="text-sm text-gray-600">
                            Your answer: <strong>{q.userAnswer}</strong>
                            <br />
                            Correct: <strong>{qData?.back}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" onClick={() => navigate(`/folders/${folderId}`)}>
                  Back to Folder
                </Button>
                <Button onClick={() => {
                  navigate(`/folders/${folderId}/quiz`)
                  retryQuiz()
                }}>
                  Retry Quiz
                </Button>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  );
};

export default QuizResults;
