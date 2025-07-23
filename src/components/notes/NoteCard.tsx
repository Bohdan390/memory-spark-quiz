
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Note } from '@/types/models';
import { formatDistanceToNow } from 'date-fns';

interface NoteCardProps {
  note: Note;
  folderId: string;
  onDelete: (noteId: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, folderId, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete the note "${note.title}"?`)) {
      onDelete(note.id);
    }
  };
  
  // Simple function to strip markdown formatting for the card preview
  const stripMarkdown = (text: string) => {
    return text
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/__(.*?)__/g, '$1') // Remove underline
      .replace(/^- /gm, '') // Remove list bullets
      .trim();
  };
  
  return (
    <Link to={`/folders/${folderId}/notes/${note.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow border-2 hover:border-memoquiz-purple/20">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base line-clamp-1">{note.title}</CardTitle>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete note</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {stripMarkdown(note.content)}
          </p>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default NoteCard;
