import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import NoteSelectionModal from '@/components/quiz/NoteSelectionModal';
import { ArrowLeft, Edit2, Save, X, Trash2, Brain, History, Target, Calendar, Clock, TrendingUp, CheckSquare } from 'lucide-react';
import { QuizQuestion, QuizResult } from '@/types/models';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const QuizManagementPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { 
    getFolder, 
    generateQuiz,
    generateMultipleChoiceQuiz,
    isGeneratingQuiz, 
    getQuizResults,
    getFolderQuestions, 
    updateQuestion, 
    createQuestion,
    deleteQuestion,
    quizQuestions,
    cleanupOrphanedQuizResults
  } = useApp();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Partial<QuizQuestion>>({});
  const [isNoteSelectionModalOpen, setIsNoteSelectionModalOpen] = useState(false);
  const [folderQuizResults, setFolderQuizResults] = useState<QuizResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  const folder = getFolder(folderId || '');
  
  useEffect(() => {
    // Load only quiz questions for the current folder
    const folderQuestions = quizQuestions
      .filter((q: any) => q.folder_id === folderId)
      .map((q: any) => ({
        ...q,
        nextReviewDate: new Date(q.nextReviewDate),
        lastReviewed: q.lastReviewed ? new Date(q.lastReviewed) : null,
      }));
    setQuestions(folderQuestions);
  }, [quizQuestions, folderId]);

  useEffect(() => {
    // Load quiz results for this folder
    const loadQuizResults = async () => {
      if (!folderId) return;
      
      setIsLoadingResults(true);
      try {
        const results = await getQuizResults(folderId);
        console.log('Loading quiz results for folder:', results);
        setFolderQuizResults(results);
      } catch (error) {
        console.error('Error loading quiz results:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quiz results.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingResults(false);
      }
    };

    loadQuizResults();
  }, [folderId, getQuizResults, toast]);
  
  if (!folder) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Folder not found</h1>
        <Button onClick={() => navigate('/folders')}>
          Go back to folders
        </Button>
      </div>
    );
  }
  

  const [quizType, setQuizType] = useState<'mixed' | 'multipleChoice'>('mixed');

  const handleGenerateQuestions = () => {
    if (!folderId || !folder || folder.notes.length === 0) return;
    
    setIsNoteSelectionModalOpen(true);
  };

  const handleConfirmNoteSelection = async (selectedNoteIds: string[]) => {
    if (!folderId) return;
    
    try {
      let newQuestions;
      if (quizType === 'multipleChoice') {
        newQuestions = await generateMultipleChoiceQuiz(folderId, selectedNoteIds);
        toast({
          title: 'Multiple Choice Questions Generated!',
          description: `Generated ${newQuestions.length} multiple choice questions from ${selectedNoteIds.length} selected notes.`
        });
      } else {
        newQuestions = await generateQuiz(folderId, selectedNoteIds);
        toast({
          title: 'Questions Generated!',
          description: `Generated ${newQuestions.length} new quiz questions from ${selectedNoteIds.length} selected notes.`
        });
      }
      // The questions will be automatically updated by the useEffect that filters by folderId
      setIsNoteSelectionModalOpen(false);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate quiz questions. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question.id);
    setEditedQuestion(question);
  };
  
  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      if (!editedQuestion.id?.includes('manual')) {
        await updateQuestion(editingQuestion, editedQuestion);
      } else {
        await createQuestion(folderId as string, editedQuestion as QuizQuestion);
      }
      setQuestions(prev => prev.map(q => 
          q.id === editingQuestion 
          ? { ...q, ...editedQuestion }
          : q
      ));
      setEditingQuestion(null);
      setEditedQuestion({});
      
      toast({
        title: 'Question Updated',
        description: 'Your question has been saved successfully.'
      });
    } catch (error) {
      console.error('Failed to update question:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update the question. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditedQuestion({});
  };
  
  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion(questionId);
    
    // Update local state
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    toast({
      title: 'Question Deleted',
      description: 'The question has been removed from your question bank.'
    });
  };
  
  const handleCleanupOrphanedData = async () => {
    setIsCleaningUp(true);
    try {
      await cleanupOrphanedQuizResults();
      toast({
        title: 'Cleanup completed',
        description: 'Orphaned quiz results have been cleaned up successfully.'
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: 'Cleanup failed',
        description: 'Failed to clean up orphaned data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };


  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'multipleChoice': return 'bg-blue-100 text-blue-800';
      case 'fillInBlank': return 'bg-green-100 text-green-800';
      case 'shortAnswer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTotalStats = () => {
    const totalQuizzes = folderQuizResults.length;
    const totalQuestions = folderQuizResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const totalCorrect = folderQuizResults.reduce((sum, result) => sum + result.correctAnswers, 0);
    const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    return { totalQuizzes, totalQuestions, totalCorrect, averageScore };
  };
  
  const stats = getTotalStats();
  
  // Chart data for accuracy over time
  const chartData = React.useMemo(() => {
    return folderQuizResults
      .map(result => ({
        date: new Date(result.date).toLocaleDateString(),
        accuracy: Math.round((result.correctAnswers / result.totalQuestions) * 100),
        questionsAnswered: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        timestamp: new Date(result.date).getTime()
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [folderQuizResults]);
  
  // Helper function to format dates beautifully
  const formatQuizDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const quizDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let relativeTime = '';
    if (diffInMinutes < 1) relativeTime = 'Just now';
    else if (diffInMinutes < 60) relativeTime = `${diffInMinutes}m ago`;
    else if (diffInHours < 24) relativeTime = `${diffInHours}h ago`;
    else if (diffInDays < 7) relativeTime = `${diffInDays}d ago`;
    else relativeTime = formatDistanceToNow(date, { addSuffix: true });

    const formattedDate = format(date, 'MMM dd, yyyy');
    const formattedTime = format(date, 'h:mm a');

    return {
      relativeTime,
      formattedDate,
      formattedTime,
      isToday: quizDate.getTime() === today.getTime(),
      isYesterday: quizDate.getTime() === yesterday.getTime()
    };
  };
  
  console.log(folderQuizResults)
  return (
    <div>
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => navigate(`/folders/${folderId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {folder.name}
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Quiz Management - {folder.name}
        </h1>
        <p className="text-muted-foreground">
          Manage your quiz questions and review performance history
        </p>
      </div>
      
      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History ({folderQuizResults.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Question Bank</h2>
              <p className="text-sm text-muted-foreground">
                {questions.length === 0 ? 'No questions yet' : `${questions.length} questions in your bank`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCleanupOrphanedData}
                variant="outline"
                disabled={isCleaningUp}
              >
                {isCleaningUp ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cleanup Orphaned Data
                  </>
                )}
              </Button>
              <Button 
                onClick={() => {
                  setQuizType('mixed');
                  handleGenerateQuestions();
                }}
                disabled={isGeneratingQuiz || folder.notes.length === 0}
                className="bg-memoquiz-purple hover:bg-memoquiz-purple/90"
              >
                <Brain className="mr-2 h-4 w-4" />
                {isGeneratingQuiz ? 'Generating...' : 'Mixed Questions'}
              </Button>
              <Button 
                onClick={() => {
                  setQuizType('multipleChoice');
                  handleGenerateQuestions();
                }}
                disabled={isGeneratingQuiz || folder.notes.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                {isGeneratingQuiz ? 'Generating...' : 'Multiple Choice'}
              </Button>
            </div>
          </div>
          
          {questions.length === 0 ? (
            <Card className="text-center py-10">
              <CardContent>
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate questions from your notes to get started.
                </p>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">Generate questions from your notes:</p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={() => {
                          setQuizType('mixed');
                          handleGenerateQuestions();
                        }}
                        disabled={folder.notes.length === 0}
                        variant={quizType === 'mixed' ? 'default' : 'outline'}
                        className="bg-memoquiz-purple hover:bg-memoquiz-purple/90"
                      >
                        <Brain className="mr-2 h-4 w-4" /> Mixed Questions
                      </Button>
                      <Button 
                        onClick={() => {
                          setQuizType('multipleChoice');
                          handleGenerateQuestions();
                        }}
                        disabled={folder.notes.length === 0}
                        variant={quizType === 'multipleChoice' ? 'default' : 'outline'}
                        className="bg-blue-600 hover:bg-blue-700"
                        style={{color: 'white'}}
                      >
                        <CheckSquare className="mr-2 h-4 w-4" /> Multiple Choice Only
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
                        <Badge className={getTypeColor(question.type)}>
                          {question.type === 'fillInBlank' ? 'Fill in Blank' :
                           question.type === 'multipleChoice' ? 'Multiple Choice' :
                           'Short Answer'}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditQuestion(question)}
                          disabled={editingQuestion === question.id}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingQuestion === question.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Question</label>
                          <Textarea
                            value={editedQuestion.question || ''}
                            onChange={(e) => setEditedQuestion(prev => ({ ...prev, question: e.target.value }))}
                            placeholder="Enter your question"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Answer</label>
                          <Input
                            value={editedQuestion.answer || ''}
                            onChange={(e) => setEditedQuestion(prev => ({ ...prev, answer: e.target.value }))}
                            placeholder="Enter the correct answer"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveQuestion}>
                            <Save className="mr-2 h-4 w-4" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium">{question.question}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            <strong>Answer:</strong> {question.answer}
                          </p>
                        </div>
                        {question.options && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              <strong>Options:</strong> {question.options.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Quiz History</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (folderId) {
                  setIsLoadingResults(true);
                  getQuizResults(folderId).then(results => {
                    setFolderQuizResults(results);
                    setIsLoadingResults(false);
                  }).catch(error => {
                    console.error('Error refreshing quiz results:', error);
                    setIsLoadingResults(false);
                  });
                }
              }}
              disabled={isLoadingResults}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {isLoadingResults ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
            {isLoadingResults ? (
              <Card className="text-center py-10">
                <CardContent>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Loading Quiz History</h3>
                  <p className="text-muted-foreground">
                    Fetching your quiz results...
                  </p>
                </CardContent>
              </Card>
            ) : folderQuizResults.length === 0 ? (
              <Card className="text-center py-10">
                <CardContent>
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Quiz History</h3>
                  <p className="text-muted-foreground">
                    Take your first quiz to see results here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {folderQuizResults.map((result, index) => {
                  const dateInfo = formatQuizDate(result.date);
                  return (
                    <Card key={`${result.date.getTime()}-${index}`} className="relative overflow-hidden">
                      {/* Date badge */}
                      
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">Quiz #{folderQuizResults.length - index}</h3>
                              <Badge variant="outline" className="text-xs">
                                {result.totalQuestions} questions
                              </Badge>
                              <div className="text-xs">
                                <Badge 
                                  variant="secondary" 
                                  className={`flex items-center gap-1 text-xs ${
                                    dateInfo.isToday ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    dateInfo.isYesterday ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                  }`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  {dateInfo.isToday ? 'Today' : dateInfo.isYesterday ? 'Yesterday' : dateInfo.formattedDate}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Date and time info */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{dateInfo.formattedTime}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{dateInfo.relativeTime}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-3xl font-bold mb-1">
                              {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.correctAnswers}/{result.totalQuestions} correct
                            </div>
                          </div>
                        </div>
                        
                        {result.questionResults && (
                          <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Question Results
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {result.questionResults.map((qResult, qIndex) => (
                                <div key={`${result.date.getTime()}-q${qIndex}`} className="flex items-center justify-between text-sm border rounded-lg p-3 bg-muted/30">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs bg-background px-2 py-1 rounded">Q{qIndex + 1}</span>
                                    <span className="text-muted-foreground">{qResult.userAnswer || 'No answer'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      qResult.correct 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                      {qResult.correct ? '✓ Correct' : '✗ Incorrect'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {Math.round(qResult.responseTime / 1000)}s
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Questions Answered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Correct Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalCorrect}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageScore}%</div>
              </CardContent>
            </Card>
          </div>
          
          {folderQuizResults.length > 0 && (
            <>
              {/* Accuracy Over Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Accuracy Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: any, name: any) => [
                          `${value}%`, 
                          name === 'accuracy' ? 'Accuracy' : name
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Over Time List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {folderQuizResults.map((result, index) => {
                      const dateInfo = formatQuizDate(result.date);
                      const score = Math.round((result.correctAnswers / result.totalQuestions) * 100);
                      return (
                        <div key={`${result.date.getTime()}-${index}`} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">Quiz #{folderQuizResults.length - index}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{dateInfo.formattedDate}</span>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{dateInfo.formattedTime}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    score >= 90 ? 'bg-green-500' :
                                    score >= 80 ? 'bg-blue-500' :
                                    score >= 70 ? 'bg-yellow-500' :
                                    score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium w-12 ${
                                score >= 90 ? 'text-green-600' :
                                score >= 80 ? 'text-blue-600' :
                                score >= 70 ? 'text-yellow-600' :
                                score >= 50 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {score}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.correctAnswers}/{result.totalQuestions}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <NoteSelectionModal
        isOpen={isNoteSelectionModalOpen}
        onClose={() => setIsNoteSelectionModalOpen(false)}
        notes={folder?.notes || []}
        onConfirm={handleConfirmNoteSelection}
        isLoading={isGeneratingQuiz}
      />
    </div>
  );
};

export default QuizManagementPage; 