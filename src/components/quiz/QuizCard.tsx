import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuestionType, ReviewResult } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Brain, 
  Target, 
  Star, 
  RotateCcw, 
  Eye, 
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
  DialogContent,
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

let timer: NodeJS.Timeout | null = null;

// Utility function for enhanced answer comparison
const normalizeAnswer = (answer: string) => {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, '') // Remove special characters except letters, numbers, and spaces
    .trim();
};

// Enhanced comparison function that handles common variations
const compareAnswers = (userAnswer: string, correctAnswer: string): boolean => {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);
  
  // Exact match after normalization
  if (normalizedUser === normalizedCorrect) {
    return true;
  }
  
  // Handle common variations
  const variations = [
    // Common abbreviations
    { from: 'united states', to: 'usa' },
    { from: 'united kingdom', to: 'uk' },
    { from: 'new york city', to: 'nyc' },
    { from: 'los angeles', to: 'la' },
    { from: 'san francisco', to: 'sf' },
    { from: 'doctor', to: 'dr' },
    { from: 'mister', to: 'mr' },
    { from: 'misses', to: 'mrs' },
    { from: 'miss', to: 'ms' },
    { from: 'professor', to: 'prof' },
    { from: 'street', to: 'st' },
    { from: 'avenue', to: 'ave' },
    { from: 'boulevard', to: 'blvd' },
    { from: 'road', to: 'rd' },
    { from: 'drive', to: 'dr' },
    { from: 'circle', to: 'cir' },
    { from: 'lane', to: 'ln' },
    { from: 'place', to: 'pl' },
    { from: 'court', to: 'ct' },
    { from: 'apartment', to: 'apt' },
    { from: 'building', to: 'bldg' },
    { from: 'company', to: 'co' },
    { from: 'corporation', to: 'corp' },
    { from: 'incorporated', to: 'inc' },
    { from: 'limited', to: 'ltd' },
    { from: 'department', to: 'dept' },
    { from: 'government', to: 'gov' },
    { from: 'university', to: 'univ' },
    { from: 'college', to: 'col' },
    { from: 'institute', to: 'inst' },
    { from: 'association', to: 'assoc' },
    { from: 'organization', to: 'org' },
    { from: 'international', to: 'intl' },
    { from: 'national', to: 'natl' },
    { from: 'federal', to: 'fed' },
    { from: 'state', to: 'st' },
    { from: 'county', to: 'co' },
    { from: 'city', to: 'cty' },
    { from: 'town', to: 'tn' },
    { from: 'village', to: 'vlg' },
    { from: 'district', to: 'dist' },
    { from: 'region', to: 'reg' },
    { from: 'area', to: 'ar' },
    { from: 'zone', to: 'zn' },
    { from: 'section', to: 'sec' },
    { from: 'division', to: 'div' },
    { from: 'branch', to: 'br' },
    { from: 'office', to: 'off' },
    { from: 'center', to: 'ctr' },
    { from: 'centre', to: 'ctr' },
    { from: 'hospital', to: 'hosp' },
    { from: 'school', to: 'sch' },
    { from: 'library', to: 'lib' },
    { from: 'museum', to: 'mus' },
    { from: 'theater', to: 'theatre' },
    { from: 'theatre', to: 'theater' },
    { from: 'color', to: 'colour' },
    { from: 'colour', to: 'color' },
    { from: 'favorite', to: 'favourite' },
    { from: 'favourite', to: 'favorite' },
    { from: 'labor', to: 'labour' },
    { from: 'labour', to: 'labor' },
    { from: 'neighbor', to: 'neighbour' },
    { from: 'neighbour', to: 'neighbor' },
    { from: 'honor', to: 'honour' },
    { from: 'honour', to: 'honor' },
    { from: 'behavior', to: 'behaviour' },
    { from: 'behaviour', to: 'behavior' },
    { from: 'center', to: 'centre' },
    { from: 'centre', to: 'center' },
    { from: 'meter', to: 'metre' },
    { from: 'metre', to: 'meter' },
    { from: 'liter', to: 'litre' },
    { from: 'litre', to: 'liter' },
    { from: 'kilometer', to: 'kilometre' },
    { from: 'kilometre', to: 'kilometer' },
    { from: 'centimeter', to: 'centimetre' },
    { from: 'centimetre', to: 'centimeter' },
    { from: 'millimeter', to: 'millimetre' },
    { from: 'millimetre', to: 'millimeter' },
    { from: 'gram', to: 'gramme' },
    { from: 'gramme', to: 'gram' },
    { from: 'kilogram', to: 'kilogramme' },
    { from: 'kilogramme', to: 'kilogram' },
    { from: 'ton', to: 'tonne' },
    { from: 'tonne', to: 'ton' },
    { from: 'pound', to: 'lb' },
    { from: 'ounce', to: 'oz' },
    { from: 'inch', to: 'in' },
    { from: 'foot', to: 'ft' },
    { from: 'yard', to: 'yd' },
    { from: 'mile', to: 'mi' },
    { from: 'gallon', to: 'gal' },
    { from: 'quart', to: 'qt' },
    { from: 'pint', to: 'pt' },
    { from: 'cup', to: 'c' },
    { from: 'tablespoon', to: 'tbsp' },
    { from: 'teaspoon', to: 'tsp' },
    { from: 'minute', to: 'min' },
    { from: 'hour', to: 'hr' },
    { from: 'second', to: 'sec' },
    { from: 'year', to: 'yr' },
    { from: 'month', to: 'mo' },
    { from: 'week', to: 'wk' },
    { from: 'day', to: 'd' },
    { from: 'january', to: 'jan' },
    { from: 'february', to: 'feb' },
    { from: 'march', to: 'mar' },
    { from: 'april', to: 'apr' },
    { from: 'may', to: 'may' },
    { from: 'june', to: 'jun' },
    { from: 'july', to: 'jul' },
    { from: 'august', to: 'aug' },
    { from: 'september', to: 'sep' },
    { from: 'october', to: 'oct' },
    { from: 'november', to: 'nov' },
    { from: 'december', to: 'dec' },
    { from: 'monday', to: 'mon' },
    { from: 'tuesday', to: 'tue' },
    { from: 'wednesday', to: 'wed' },
    { from: 'thursday', to: 'thu' },
    { from: 'friday', to: 'fri' },
    { from: 'saturday', to: 'sat' },
    { from: 'sunday', to: 'sun' },
  ];
  
  // Check if user answer matches any variation of the correct answer
  for (const variation of variations) {
    if (normalizedUser === variation.from && normalizedCorrect === variation.to) {
      return true;
    }
    if (normalizedUser === variation.to && normalizedCorrect === variation.from) {
      return true;
    }
  }
  
  return false;
};

export const QuizCard: React.FC<QuizCardProps> = ({
  questions,
  onAnswer,
  onFinish,
  showAnswer = false,
}) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
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
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);

  // Reset quiz state when questions change (new quiz session)
  useEffect(() => {
    setQuestionIndex(0);
    setQuestion(questions[0]);
    setQuestionResults([]);
    setShowFeedback(false);
    setIsCorrect(null);
    setIsAnswered(false);
    setUserAnswer('');
    setSelectedOptions([]);
    setOrderedItems(questions[0]?.options ? [...questions[0].options].sort(() => Math.random() - 0.5) : []);
    setShowHint(false);
    setIsFlipped(false);
    setConfidence(3);
    setDifficulty(3);
    setStartTime(Date.now());
    
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
  }, [questions, autoAdvanceTimer]);

  useEffect(() => {
    setStartTime(Date.now());
    setIsAnswered(false);
    setUserAnswer('');
    setSelectedOptions([]);
    setOrderedItems(question.options ? [...question.options].sort(() => Math.random() - 0.5) : []);
    setShowHint(false);
    setIsFlipped(false);
    
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
  }, [question, autoAdvanceTimer]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
      }
    };
  }, [autoAdvanceTimer]);

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
    let userAnswerText = '';
    
    if (question.type === 'multipleChoice') {
      correct = selectedOptions[0] === question.answer;
      userAnswerText = selectedOptions[0] || '';
    } else if (question.type === 'fillInBlank' || question.type === 'typing' || question.type === 'reversedCard') {
      correct = compareAnswers(userAnswer, question.answer);
      userAnswerText = userAnswer;
      
    } else if (question.type === 'trueFalse') {
      correct = userAnswer === question.answer.toLowerCase();
      userAnswerText = userAnswer;
    } else if (question.type === 'cloze') {
      const blanks = question.blanks || [];
      
      correct = blanks.every((blank, index) => {
        return compareAnswers(selectedOptions[index] || '', blank);
      });
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
    
    setQuestionResults(prev => [...prev, newQuestionResult]);
    
    setIsCorrect(correct);
    setShowFeedback(true);
    setIsAnswered(true);
    onAnswer(result);
    
    timer = setTimeout(() => {
      handleNextQuestion();
    }, 5000);
  };

  const handleNextQuestion = () => {
    if (timer) clearTimeout(timer);
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    
    setShowFeedback(false);
    setIsCorrect(null);
    if (questionIndex < questions.length - 1) {
      setQuestion(questions[questionIndex + 1]);
      setQuestionIndex(questionIndex + 1);
    } else {
      onFinish(questionResults);
      setQuestionResults([]);
    }
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
        
        <div className="flex gap-2">
          {!isAnswered && (
            <Button 
              onClick={() => {
                const isCorrect = blanks.every((blank, index) => {
                  return compareAnswers(selectedOptions[index] || '', blank);
                });
                handleSubmitAnswer(isCorrect ? 3 : 1);
              }}
              disabled={selectedOptions.length === 0}
            >
              Submit Answer
            </Button>
          )}
          {isAnswered && (
            <Button 
              onClick={handleNextQuestion}
              className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
            >
              {questionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Finish Quiz
                  <Trophy className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
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
      
      <div className="flex gap-2">
        {!isAnswered && (
          <Button 
            onClick={() => {
              const isCorrect = compareAnswers(userAnswer, question.answer);
              handleSubmitAnswer(isCorrect ? 3 : 1);
            }}
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </Button>
        )}
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
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
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
        
        <div className="flex gap-2">
          {!isAnswered && (
            <Button onClick={() => handleSubmitAnswer(3)}>
              Submit Matches
            </Button>
          )}
          {isAnswered && (
            <Button 
              onClick={handleNextQuestion}
              className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
            >
              {questionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Finish Quiz
                  <Trophy className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
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
      
      <div className="flex gap-2">
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
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
        {!isAnswered && (
          <Button 
            onClick={() => handleSubmitAnswer(3)}
            disabled={!userAnswer.trim()}
          >
            Submit Definition
          </Button>
        )}
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
        {!isAnswered && (
          <Button 
            onClick={() => handleSubmitAnswer(3)}
            disabled={!userAnswer.trim()}
          >
            Submit Comparison
          </Button>
        )}
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
        {!isAnswered && (
          <Button 
            onClick={() => handleSubmitAnswer(3)}
            disabled={!userAnswer.trim()}
          >
            Submit Application
          </Button>
        )}
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
        {!isAnswered && (
          <Button 
            onClick={() => handleSubmitAnswer(3)}
            disabled={!userAnswer.trim()}
          >
            Submit Explanation
          </Button>
        )}
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
        {!isAnswered && (
          <Button 
            onClick={() => handleSubmitAnswer(3)}
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </Button>
        )}
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
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
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
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
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
      
      <div className="flex gap-2">
        {!isAnswered && (
                                                                                           <Button 
                onClick={() => {
                  const isCorrect = compareAnswers(userAnswer, question.question);
                  handleSubmitAnswer(isCorrect ? 3 : 1);
                }}
                disabled={!userAnswer.trim()}
              >
            Submit Answer
          </Button>
        )}
        {isAnswered && (
          <Button 
            onClick={handleNextQuestion}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            {questionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Finish Quiz
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
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
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display">
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
