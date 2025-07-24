
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Brain, Calendar } from 'lucide-react';

const QuizzesPage: React.FC = () => {
  const { quizResults, folders } = useApp();
  const navigate = useNavigate();
  
  // Sort quiz results by date (newest first)
  const sortedResults = [...quizResults].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get folder name by ID
  const getFolderName = (id: string) => {
    const folder = folders.find(f => f.id === id);
    return folder ? folder.name : 'Unknown Folder';
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Quiz History</h1>
      
      {sortedResults.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You haven't taken any quizzes yet.</p>
          <Button onClick={() => navigate('/folders')}>
            Go to folders
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedResults.map(result => {
            console.log(result);
            const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
            const folderName = getFolderName(result.folder_id);
            
            return (
              <Card key={result.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-medium">{folderName}</h2>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDistanceToNow(new Date(result.date), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/folders/${result.folderId}/quiz`)}
                    >
                      Retake Quiz
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-memoquiz-purple" />
                        <span>{result.correctAnswers} out of {result.totalQuestions} correct</span>
                      </div>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;
