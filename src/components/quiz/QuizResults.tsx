
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Target, 
  Clock, 
  BarChart3,
  RotateCcw,
  ArrowLeft,
  Star,
  Zap,
  History,
  TrendingUp
} from 'lucide-react';
import { QuizQuestion, QuizResult } from '@/types/models';
import { useApp } from '@/context/AppContext';

interface QuizResultsProps {
  quizResults: Partial<QuizResult>;
  questions: QuizQuestion[];
  folderId: string;
  retryQuiz: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ quizResults, questions, folderId, retryQuiz }) => {
  const navigate = useNavigate();
  const { getQuizResults } = useApp();
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isResultsLoading, setIsResultsLoading] = useState(true);

  const correctAnswers = typeof quizResults.correctAnswers === 'number' ? quizResults.correctAnswers : 0;
  const totalQuestions = typeof quizResults.totalQuestions === 'number' ? quizResults.totalQuestions : 0;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Load quiz history
  useEffect(() => {
    const loadQuizHistory = async () => {
      try {
        const history = await getQuizResults(folderId);
        setQuizHistory(history);
      } catch (error) {
        console.error('Error loading quiz history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadQuizHistory();
  }, [folderId, getQuizResults]);

  // Handle initial results loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsResultsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Calculate statistics from real history
  const bestScore = quizHistory.length > 0 ? Math.max(...quizHistory.map(r => Math.round((r.correctAnswers / r.totalQuestions) * 100))) : 0;
  const averageScore = quizHistory.length > 0 ? Math.round(quizHistory.reduce((acc, r) => acc + Math.round((r.correctAnswers / r.totalQuestions) * 100), 0) / quizHistory.length) : 0;
  const totalTime = quizHistory.reduce((acc, r) => {
    const questionResults = r.questionResults || [];
    return acc + questionResults.reduce((sum, q) => sum + (q.responseTime || 0), 0);
  }, 0);

  // Helper function to format time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Excellent', icon: Trophy, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-950' };
    if (percentage >= 80) return { level: 'Great', icon: Star, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950' };
    if (percentage >= 70) return { level: 'Good', icon: Target, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950' };
    if (percentage >= 50) return { level: 'Fair', icon: BarChart3, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950' };
    return { level: 'Needs Work', icon: Zap, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950' };
  };

  const getMessage = () => {
    if (percentage >= 90) {
      return "Outstanding performance! You've truly mastered this material.";
    } else if (percentage >= 80) {
      return "Excellent work! You have a strong grasp of the concepts.";
    } else if (percentage >= 70) {
      return "Good job! You're making solid progress.";
    } else if (percentage >= 50) {
      return "You're on the right track, but more practice will help.";
    } else {
      return "Keep practicing! Review the material and try again.";
    }
  };

  const performance = getPerformanceLevel();
  const PerformanceIcon = performance.icon;

  // Calculate average response time
  const avgResponseTime = quizResults.questionResults?.reduce((acc, q) => acc + (q.responseTime || 0), 0) / (quizResults.questionResults?.length || 1) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isResultsLoading ? (
        <div className="space-y-6">
          {/* Loading Results Animation */}
          <div className="text-center space-y-4 py-12">
            <div className="relative inline-block">
              <div className="w-20 h-20 border-4 border-green-200 dark:border-green-800 rounded-full animate-spin border-t-green-600 dark:border-t-green-400"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold animate-pulse">Calculating Your Results...</h3>
              <p className="text-sm text-muted-foreground">Analyzing your performance and preparing insights</p>
            </div>
          </div>
          
          {/* Loading Score Display */}
          <div className="flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-8 border-gray-200 dark:border-gray-700 flex items-center justify-center animate-pulse">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-full animate-pulse"></div>
                <div className="mt-2 h-4 w-20 bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Results Card */}
          <Card className="relative overflow-hidden">
        <div className={`absolute inset-0 ${performance.bgColor} opacity-10`} />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Quiz Complete!
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <PerformanceIcon className="h-4 w-4" />
              {performance.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-6">
          {/* Prominent Score Summary */}
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted/50">
              <div className={`w-4 h-4 rounded-full ${
                percentage >= 90 ? 'bg-green-500' :
                percentage >= 80 ? 'bg-blue-500' :
                percentage >= 70 ? 'bg-yellow-500' :
                percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'
              }`} />
              <span className="text-lg font-semibold">
                Quiz Complete • {percentage}% Score
              </span>
            </div>
          </div>
          
          {/* Score Display */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-8 border-gray-200 dark:border-gray-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
                <div className="text-center relative z-10">
                  <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 animate-in slide-in-from-bottom-2 duration-500">
                    {percentage}%
                  </div>
                </div>
              </div>
              <Progress 
                value={percentage} 
                className="absolute inset-0 w-40 h-40 rounded-full animate-in zoom-in-50 duration-700"
                style={{ transform: 'rotate(-90deg)' }}
              />
            </div>
          </div>
          
          {/* Large Percentage Display */}
          <div className="text-center">
            <div className="text-xl text-muted-foreground mb-4">
              {performance.level} Performance
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800 animate-in slide-in-from-left-4 duration-500">
              <div className="relative">
                <CheckCircle2 className="h-8 w-8 text-green-600 animate-in zoom-in-50 duration-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 animate-in slide-in-from-bottom-2 duration-500 delay-200">
                  {correctAnswers}
                </div>
                <div className="text-sm text-muted-foreground animate-in slide-in-from-bottom-2 duration-500 delay-300">
                  Correct
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border border-red-200 dark:border-red-800 animate-in slide-in-from-bottom-4 duration-500 delay-100">
              <div className="relative">
                <XCircle className="h-8 w-8 text-red-600 animate-in zoom-in-50 duration-500 delay-100" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse delay-100"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                  {totalQuestions - correctAnswers}
                </div>
                <div className="text-sm text-muted-foreground animate-in slide-in-from-bottom-2 duration-500 delay-400">
                  Incorrect
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 animate-in slide-in-from-right-4 duration-500 delay-200">
              <div className="relative">
                <Clock className="h-8 w-8 text-blue-600 animate-in zoom-in-50 duration-500 delay-200" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-200"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 animate-in slide-in-from-bottom-2 duration-500 delay-400">
                  {Math.round(avgResponseTime / 1000)}s
                </div>
                <div className="text-sm text-muted-foreground animate-in slide-in-from-bottom-2 duration-500 delay-500">
                  Avg Time
                </div>
              </div>
            </div>
          </div>

          {/* Performance Message */}
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-lg font-medium">{getMessage()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Question Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {quizResults?.questionResults?.map((q, index) => {
              const qData = questions.find(question => question.id === q.questionId);
              const isCorrect = q.correct;
              
              return (
                <div 
                  key={q.questionId || `question-${index}`} 
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCorrect 
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800' 
                      : 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Q{index + 1}</Badge>
                        {!isCorrect && (
                          <Badge variant="destructive" className="text-xs">
                            {Math.round(q.responseTime / 1000)}s
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">
                        {qData?.front || "Unknown question"}
                      </p>
                      {!isCorrect && (
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-medium">Your answer:</span>
                            <span className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">
                              {q.userAnswer}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 font-medium">Correct answer:</span>
                            <span className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                              {qData?.back}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quiz History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Quiz History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 animate-pulse">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
                    <div className="h-4 w-16 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-12 bg-blue-200 dark:bg-blue-800 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-20 bg-blue-200/50 dark:bg-blue-800/50 rounded animate-pulse"></div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800 animate-pulse">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 bg-green-200 dark:bg-green-800 rounded-full animate-pulse"></div>
                    <div className="h-4 w-16 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-12 bg-green-200 dark:bg-green-800 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-20 bg-green-200/50 dark:bg-green-800/50 rounded animate-pulse"></div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 animate-pulse">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 bg-purple-200 dark:bg-purple-800 rounded-full animate-pulse"></div>
                    <div className="h-4 w-16 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-12 bg-purple-200 dark:bg-purple-800 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-20 bg-purple-200/50 dark:bg-purple-800/50 rounded animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Best Score</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{bestScore}%</div>
                  <div className="text-xs text-muted-foreground">
                    {quizHistory.length > 0 ? `${quizHistory.length} attempts` : 'No attempts yet'}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Average</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{averageScore}%</div>
                  <div className="text-xs text-muted-foreground">
                    {quizHistory.length > 0 ? `Last ${Math.min(quizHistory.length, 5)} quizzes` : 'No attempts yet'}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Total Time</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{Math.round(totalTime / 1000 / 60)}m</div>
                  <div className="text-xs text-muted-foreground">
                    {quizHistory.length > 0 ? `${quizHistory.length} quizzes` : 'No attempts yet'}
                  </div>
                </div>
              </div>
            )}
            
            {/* Recent Quiz Attempts */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Recent Attempts</h4>
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/50 border border-muted/50 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-5 w-16 bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50 rounded animate-pulse"></div>
                          <div className="h-3 w-20 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/40 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-5 w-20 bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/40 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : quizHistory.length > 0 ? (
                <div className="space-y-2">
                  {quizHistory.slice(0, 5).map((attempt, index) => {
                    const attemptScore = Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100);
                    const attemptTime = attempt.questionResults?.reduce((sum, q) => sum + (q.responseTime || 0), 0) || 0;
                    const timeAgo = getTimeAgo(attempt.date);
                    
                                         return (
                       <div key={`attempt-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            attemptScore >= 90 ? 'bg-green-500' :
                            attemptScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <div className="font-medium">{attemptScore}%</div>
                            <div className="text-xs text-muted-foreground">{attempt.totalQuestions} questions</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{timeAgo}</div>
                          <div className="text-xs text-muted-foreground">{Math.round(attemptTime / 1000)}s</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No quiz attempts yet. Complete your first quiz to see history here!
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/folders/${folderId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Folder
        </Button>
        <Button 
          onClick={() => {
            navigate(`/folders/${folderId}/quiz`);
            retryQuiz();
          }}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Quiz
        </Button>
      </div>
        </>
      )}
    </div>
  );
};

export default QuizResults;
