
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const RecentPage: React.FC = () => {
  const { folders } = useApp();
  const navigate = useNavigate();
  
  // Get all notes from all folders and sort by updated date
  const allNotes = folders.flatMap(folder => 
    folder.notes.map(note => ({ ...note, folderId: folder.id, folderName: folder.name }))
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  // Get recent notes (last 10)
  const recentNotes = allNotes.slice(0, 10);
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Recent Notes</h1>
      
      {recentNotes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You don't have any notes yet.</p>
          <Button onClick={() => navigate('/folders')}>
            Go to folders
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {recentNotes.map(note => (
            <Card key={note.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-medium line-clamp-1">{note.title}</h2>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Book className="h-3 w-3 mr-1" />
                      <span>{note.folderName}</span>
                      <span className="mx-2">•</span>
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/folders/${note.folderId}/notes/${note.id}`)}
                  >
                    Open
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentPage;
