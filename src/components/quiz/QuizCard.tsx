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
  Timer
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
  const [quizResult, setQuizResult] = useState<Partial<QuizResult>>({});

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
    let correct = false;
    if ('answer' in question && selectedOptions[0] === question.answer) {
      correct = true;
    }
    const newQuestionResult: QuestionResult = {
      questionId: question.id,
      correct,
      userAnswer: selectedOptions[0],
      responseTime,
      confidence,
      difficulty
    };
    questionResults.push(newQuestionResult)
    setTimeout(() => {
      console.log(questionResults, "123")
      if (questionIndex < questions.length - 1) {
        setQuestion(questions[questionIndex + 1])
        setQuestionIndex(questionIndex + 1);
      } else {
        onFinish(questionResults);
        questionResults = [];
        // if (quizResult) {
        //   quizResult.correctAnswers = questionResults.filter(
        //     (_q: any) => _q.correct
        //   ).length;
        //   quizResult.date = new Date();
        //   quizResult.folder_id = question.folder_id;
        //   quizResult.totalQuestions = questions.length;
        //   quizResult.user_id = question.user_id;
        //   quizResult.questionResults = questionResults;
        // }
        // console.log(quizResult)
        // setShowResultModal(true);
      }
    }, 5000)
    setIsAnswered(true);
    setShowExplanation(true);
    onAnswer(result);
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
      
      <CardContent className="space-y-6">
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
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">Correct Answer:</h4>
              <div className="p-3 bg-green-50 rounded-lg text-green-800">
                {question.answer}
              </div>
            </div>
            
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
