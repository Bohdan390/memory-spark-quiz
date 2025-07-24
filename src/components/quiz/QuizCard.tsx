import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuestionType, ReviewResult, QuizResult } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Brain, 
  Target, 
  Star, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Lightbulb,
  Trophy,
  Zap,
  Heart,
  X,
  Check,
  ArrowRight,
  Shuffle,
  Timer,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

type QuestionResult = {
  questionId: string;
  correct: boolean;
  userAnswer: string;
  responseTime: number;
  confidence: number;
  difficulty: number;
};

interface QuizCardProps {
  questions: QuizQuestion [],
  question: QuizQuestion;
  onAnswer: (result: ReviewResult) => void;
  onFinish: (results: QuestionResult[]) => void;
  showAnswer?: boolean;
  isReview?: boolean;
}

let questionResults: QuestionResult[] = [];

export const QuizCard: React.FC<QuizCardProps> = ({
  questions,
  onAnswer,
  onFinish,
  showAnswer = false,
  isReview = false
}) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<{ [key: string]: string }>({});
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [confidence, setConfidence] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [isFlipped, setIsFlipped] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion>(questions[0]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizResult, setQuizResult] = useState<Partial<QuizResult>>({});
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  useEffect(() => {
    setStartTime(Date.now());
    setIsAnswered(false);
    setUserAnswer('');
    setSelectedOptions([]);
    setOrderedItems(question.options ? [...question.options].sort(() => Math.random() - 0.5) : []);
    setMatchedPairs({});
    setShowHint(false);
    setShowExplanation(false);
    setIsFlipped(false);
  }, [question]);

  const handleSubmitAnswer = (grade: number) => {
    if (isAnswered) return;

    const responseTime = Date.now() - startTime;
    const result: ReviewResult = {
      grade,
      responseTime,
      confidence,
      difficulty
    };
    
    // Determine if answer is correct based on question type
    let correct = false;
    let userAnswerText = '';
    
    if (question.type === 'multipleChoice') {
      correct = selectedOptions[0] === question.answer;
      userAnswerText = selectedOptions[0] || '';
    } else if (question.type === 'fillInBlank' || question.type === 'typing' || question.type === 'reversedCard') {
      correct = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();
      userAnswerText = userAnswer;
    } else if (question.type === 'trueFalse') {
      correct = userAnswer === question.answer.toLowerCase();
      userAnswerText = userAnswer;
    } else if (question.type === 'cloze') {
      const blanks = question.blanks || [];
      correct = blanks.every((blank, index) => 
        selectedOptions[index]?.toLowerCase().trim() === blank.toLowerCase().trim()
      );
      userAnswerText = selectedOptions.join(', ');
    } else if (question.type === 'ordering') {
      correct = orderedItems.every((item, index) => 
        item === question.correctOrder?.[index]
      );
      userAnswerText = orderedItems.join(' → ');
    }
    
    const newQuestionResult: QuestionResult = {
      questionId: question.id,
      correct,
      userAnswer: userAnswerText,
      responseTime,
      confidence,
      difficulty
    };
    
    questionResults.push(newQuestionResult);
    
    // Show immediate feedback
    setIsCorrect(correct);
    setShowFeedback(true);
    setIsAnswered(true);
    setShowExplanation(true);
    onAnswer(result);
    
    // Auto-advance after showing feedback
    setTimeout(() => {
      setShowFeedback(false);
      setIsCorrect(null);
      if (questionIndex < questions.length - 1) {
        setQuestion(questions[questionIndex + 1]);
        setQuestionIndex(questionIndex + 1);
      } else {
        onFinish(questionResults);
        questionResults = [];
      }
    }, 3000); // Show feedback for 3 seconds
  };
  const renderQuestionByType = () => {
    switch (question.type) {
      case 'flashcard':
        return renderFlashcard();
      case 'cloze':
        return renderClozeDeletion();
      case 'fillInBlank':
        return renderFillInBlank();
      case 'multipleChoice':
        return renderMultipleChoice();
      case 'matching':
        return renderMatching();
      case 'ordering':
        return renderOrdering();
      case 'definition':
        return renderDefinition();
      case 'comparison':
        return renderComparison();
      case 'application':
        return renderApplication();
      case 'explanation':
        return renderExplanation();
      case 'shortAnswer':
        return renderShortAnswer();
      case 'trueFalse':
        return renderTrueFalse();
      case 'typing':
        return renderTyping();
      case 'reversedCard':
        return renderReversedCard();
      default:
        return renderFillInBlank();
    }
  };

  const renderFlashcard = () => (
    <div className="space-y-4">
      <div 
        className="relative h-48 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={cn(
          "absolute inset-0 w-full h-full transition-transform duration-600 transform-style-preserve-3d",
          isFlipped && "rotate-y-180"
        )}>
          {/* Front */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-800 mb-2">
                {question.front || question.question}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" />
                Click to reveal answer
              </div>
            </div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-800">
                {question.back || question.answer}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isFlipped && !isAnswered && (
        <div className="flex justify-center gap-2">
          <Button onClick={() => handleSubmitAnswer(1)} variant="destructive" size="sm">
            <X className="w-4 h-4 mr-1" />
            Again
          </Button>
          <Button onClick={() => handleSubmitAnswer(2)} variant="outline" size="sm">
            Hard
          </Button>
          <Button onClick={() => handleSubmitAnswer(3)} variant="default" size="sm">
            <Check className="w-4 h-4 mr-1" />
            Good
          </Button>
          <Button onClick={() => handleSubmitAnswer(4)} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
            <Star className="w-4 h-4 mr-1" />
            Easy
          </Button>
        </div>
      )}
    </div>
  );

  const renderClozeDeletion = () => {
    const clozedText = question.question;
    const blanks = question.blanks || [];
    
    return (
      <div className="space-y-4">
        <div className="text-lg leading-relaxed">
          {clozedText.split(/\{\{c\d+::(.*?)\}\}/).map((part, index) => {
            if (index % 2 === 0) {
              return <span key={index}>{part}</span>;
            } else {
              const blankIndex = Math.floor(index / 2);
              return (
                <Input
                  key={index}
                  className="inline-block w-auto min-w-20 mx-1"
                  placeholder="..."
                  value={selectedOptions[blankIndex] || ''}
                  onChange={(e) => {
                    const newOptions = [...selectedOptions];
                    newOptions[blankIndex] = e.target.value;
                    setSelectedOptions(newOptions);
                  }}
                />
              );
            }
          })}
        </div>
        
        {!isAnswered && (
          <Button 
            onClick={() => {
              const isCorrect = blanks.every((blank, index) => 
                selectedOptions[index]?.toLowerCase().trim() === blank.toLowerCase().trim()
              );
              handleSubmitAnswer(isCorrect ? 3 : 1);
            }}
            disabled={selectedOptions.length === 0}
          >
            Submit Answer
          </Button>
        )}
      </div>
    );
  };

  const renderFillInBlank = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {question.question}
      </div>
      
      <Input
        placeholder="Type your answer..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
        className="text-lg"
      />
      
      {!isAnswered && (
        <Button 
          onClick={() => {
            const isCorrect = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();
            handleSubmitAnswer(isCorrect ? 3 : 1);
          }}
          disabled={!userAnswer.trim()}
        >
          Submit Answer
        </Button>
      )}
    </div>
  );

  const renderMultipleChoice = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed mb-4">
        {question.question}
      </div>
      
      <div className="space-y-2">
        {question.options?.map((option, index) => (
          <Button
            key={index}
            variant={selectedOptions.includes(option) ? "default" : "outline"}
            className="w-full text-left justify-start h-auto p-3"
            onClick={() => {
              if (!isAnswered) {
                setSelectedOptions([option]);
              }
            }}
            disabled={isAnswered}
          >
            <span className="mr-3 font-mono">
              {String.fromCharCode(65 + index)}.
            </span>
            {option}
          </Button>
        ))}
      </div>
      
      {!isAnswered && selectedOptions.length > 0 && (
        <Button 
          onClick={() => {
            const isCorrect = selectedOptions[0] === question.answer;
            handleSubmitAnswer(isCorrect ? 3 : 1);
          }}
        >
          Submit Answer
        </Button>
      )}
    </div>
  );

  const renderMatching = () => {
    const leftItems = question.options?.slice(0, Math.floor(question.options.length / 2)) || [];
    const rightItems = question.options?.slice(Math.floor(question.options.length / 2)) || [];
    
    return (
      <div className="space-y-4">
        <div className="text-lg leading-relaxed mb-4">
          {question.question}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-600">Items</h4>
            {leftItems.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto p-3"
                onClick={() => {
                  // Implement matching logic
                }}
                disabled={isAnswered}
              >
                {item}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-600">Matches</h4>
            {rightItems.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto p-3"
                onClick={() => {
                  // Implement matching logic
                }}
                disabled={isAnswered}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
        
        {!isAnswered && (
          <Button onClick={() => handleSubmitAnswer(3)}>
            Submit Matches
          </Button>
        )}
      </div>
    );
  };

  const renderOrdering = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed mb-4">
        {question.question}
      </div>
      
      <div className="space-y-2">
        {orderedItems.map((item, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 p-3 border rounded-lg cursor-move"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
              const newItems = [...orderedItems];
              const [draggedItem] = newItems.splice(draggedIndex, 1);
              newItems.splice(index, 0, draggedItem);
              setOrderedItems(newItems);
            }}
          >
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-sm font-mono">
              {index + 1}
            </div>
            <div className="flex-1">{item}</div>
            <Shuffle className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>
      
      {!isAnswered && (
        <Button 
          onClick={() => {
            const isCorrect = orderedItems.every((item, index) => 
              item === question.correctOrder?.[index]
            );
            handleSubmitAnswer(isCorrect ? 3 : 1);
          }}
        >
          Submit Order
        </Button>
      )}
    </div>
  );

  const renderDefinition = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {question.question}
      </div>
      
      <Textarea
        placeholder="Provide your definition..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
        rows={3}
      />
      
      {!isAnswered && (
        <Button 
          onClick={() => handleSubmitAnswer(3)}
          disabled={!userAnswer.trim()}
        >
          Submit Definition
        </Button>
      )}
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {question.question}
      </div>
      
      <Textarea
        placeholder="Compare and contrast the concepts..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
        rows={4}
      />
      
      {!isAnswered && (
        <Button 
          onClick={() => handleSubmitAnswer(3)}
          disabled={!userAnswer.trim()}
        >
          Submit Comparison
        </Button>
      )}
    </div>
  );

  const renderApplication = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {question.question}
      </div>
      
      <Textarea
        placeholder="Describe how you would apply this concept..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
        rows={4}
      />
      
      {!isAnswered && (
        <Button 
          onClick={() => handleSubmitAnswer(3)}
          disabled={!userAnswer.trim()}
        >
          Submit Application
        </Button>
      )}
    </div>
  );

  const renderExplanation = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {question.question}
      </div>
      
      <Textarea
        placeholder="Provide a detailed explanation..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
        rows={5}
      />
      
      {!isAnswered && (
        <Button 
          onClick={() => handleSubmitAnswer(3)}
          disabled={!userAnswer.trim()}
        >
          Submit Explanation
        </Button>
      )}
    </div>
  );

  const renderShortAnswer = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {question.question}
      </div>
      
      <Textarea
        placeholder="Type your answer..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
        rows={2}
      />
      
      {!isAnswered && (
        <Button 
          onClick={() => handleSubmitAnswer(3)}
          disabled={!userAnswer.trim()}
        >
          Submit Answer
        </Button>
      )}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed mb-4">
        {question.question}
      </div>
      
      <div className="flex gap-4">
        <Button
          variant={userAnswer === 'true' ? "default" : "outline"}
          onClick={() => setUserAnswer('true')}
          disabled={isAnswered}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          True
        </Button>
        <Button
          variant={userAnswer === 'false' ? "default" : "outline"}
          onClick={() => setUserAnswer('false')}
          disabled={isAnswered}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          False
        </Button>
      </div>
      
      {!isAnswered && userAnswer && (
        <Button 
          onClick={() => {
            const isCorrect = userAnswer === question.answer.toLowerCase();
            handleSubmitAnswer(isCorrect ? 3 : 1);
          }}
        >
          Submit Answer
        </Button>
      )}
    </div>
  );

  const renderTyping = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {question.question}
      </div>
      
      <Input
        placeholder="Type the exact answer..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
        className="text-lg font-mono"
      />
      
      {!isAnswered && (
        <Button 
          onClick={() => {
            const isCorrect = userAnswer === question.answer;
            handleSubmitAnswer(isCorrect ? 3 : 1);
          }}
          disabled={!userAnswer}
        >
          Submit Answer
        </Button>
      )}
    </div>
  );

  const renderReversedCard = () => (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {question.answer} {/* Show answer as question */}
      </div>
      
      <Input
        placeholder="What term does this describe?"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
        className="text-lg"
      />
      
      {!isAnswered && (
        <Button 
          onClick={() => {
            const isCorrect = userAnswer.toLowerCase().trim() === question.question.toLowerCase().trim();
            handleSubmitAnswer(isCorrect ? 3 : 1);
          }}
          disabled={!userAnswer.trim()}
        >
          Submit Answer
        </Button>
      )}
    </div>
  );

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'flashcard': return <RotateCcw className="w-4 h-4" />;
      case 'cloze': return <Target className="w-4 h-4" />;
      case 'fillInBlank': return <Brain className="w-4 h-4" />;
      case 'multipleChoice': return <Check className="w-4 h-4" />;
      case 'matching': return <ArrowRight className="w-4 h-4" />;
      case 'ordering': return <Shuffle className="w-4 h-4" />;
      case 'definition': return <Lightbulb className="w-4 h-4" />;
      case 'comparison': return <Zap className="w-4 h-4" />;
      case 'application': return <Trophy className="w-4 h-4" />;
      case 'explanation': return <Brain className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  // Get current quiz progress and results
  const getQuizProgress = () => {
    const completedQuestions = questionResults.length;
    const correctAnswers = questionResults.filter(r => r.correct).length;
    const accuracy = completedQuestions > 0 ? Math.round((correctAnswers / completedQuestions) * 100) : 0;
    
    return {
      completedQuestions,
      correctAnswers,
      accuracy,
      totalQuestions: questions.length,
      currentQuestion: questionIndex + 1
    };
  };

  // Get question result by index
  const getQuestionResult = (index: number) => {
    return questionResults[index] || null;
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getTypeIcon(question.type)}
            <span className="capitalize">{question.type.replace(/([A-Z])/g, ' $1').trim()}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(question.difficulty.level)}>
              {question.difficulty.level}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {question.difficulty.timeEstimate}s
            </Badge>
          </div>
        </div>
        
        {/* Learning metrics */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            Streak: {question.learningMetrics.correctStreak}
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            Retention: {Math.round(question.learningMetrics.retentionRate)}%
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Reviews: {question.learningMetrics.totalReviews}
          </div>
        </div>
      </CardHeader>
      
      {/* Quiz Progress and Review Panel */}
      <div className="px-6 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">Question {questionIndex + 1}</span>
              <span className="text-muted-foreground"> of {questions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm">
                <span className="font-medium text-green-600">{getQuizProgress().correctAnswers}</span>
                <span className="text-muted-foreground"> correct</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-red-600">{getQuizProgress().completedQuestions - getQuizProgress().correctAnswers}</span>
                <span className="text-muted-foreground"> incorrect</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-blue-600">{getQuizProgress().accuracy}%</span>
                <span className="text-muted-foreground"> accuracy</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewPanel(!showReviewPanel)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showReviewPanel ? 'Hide' : 'Show'} Review
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{getQuizProgress().completedQuestions}/{getQuizProgress().totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getQuizProgress().completedQuestions / getQuizProgress().totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Review Panel */}
      {showReviewPanel && questionResults.length > 0 && (
        <div className="px-6 py-4 border-b bg-muted/20">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Previous Questions Review
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {questionResults.map((result, index) => {
              const questionData = questions[index];
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 text-xs ${
                    result.correct
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800'
                      : 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      result.correct ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">Q{index + 1}</span>
                    {result.correct ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium truncate">
                      {questionData?.question?.substring(0, 30)}...
                    </div>
                    <div className="text-muted-foreground">
                      <div className="truncate">
                        <span className="font-medium">Your answer:</span> {result.userAnswer.substring(0, 20)}...
                      </div>
                      {!result.correct && (
                        <div className="truncate">
                          <span className="font-medium">Correct:</span> {questionData?.answer?.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(result.responseTime / 1000)}s
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <CardContent className="space-y-6">
        {/* Immediate Feedback */}
        {showFeedback && (
          <div className={`p-4 rounded-lg border-2 transition-all ${
            isCorrect 
              ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800' 
              : 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
              }`}>
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </div>
                {!isCorrect && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Correct answer: <span className="font-medium">{question.answer}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {renderQuestionByType()}
        
        {/* Hint */}
        {question.hint && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              {showHint ? 'Hide' : 'Show'} Hint
            </Button>
            {showHint && (
              <div className="p-3 bg-blue-50 rounded-lg text-blue-800">
                {question.hint}
              </div>
            )}
          </div>
        )}
        
        {/* Answer and explanation */}
        {(showAnswer || isAnswered) && (
          <div className="space-y-4 border-t pt-4">
            {question.explanation && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-700">Explanation:</h4>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-800">
                  {question.explanation}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Rating controls */}
        {isAnswered && !isReview && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  How confident were you? ({confidence}/5)
                </label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={confidence >= rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfidence(rating)}
                    >
                      <Star className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">
                  How difficult was this? ({difficulty}/5)
                </label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={difficulty >= rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDifficulty(rating)}
                    >
                      <Brain className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Memory aids */}
        {question.mnemonics && question.mnemonics.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-medium text-purple-700">Memory Aids:</h4>
            <div className="space-y-1">
              {question.mnemonics.map((mnemonic, index) => (
                <div key={index} className="p-2 bg-purple-50 rounded text-purple-800 text-sm">
                  {mnemonic}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="p-0 bg-transparent shadow-none border-none max-w-xl">
          
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuizCard;
