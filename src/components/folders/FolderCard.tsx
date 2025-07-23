
import React from 'react';
import { Link } from 'react-router-dom';
import { Book, File, Trash2, FileText, PenSquare } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder } from '@/types/models';

interface FolderCardProps {
  folder: Folder;
  onDelete: (id: string) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete the folder "${folder.name}" and all its notes?`)) {
      onDelete(folder.id);
    }
  };
  
  const getFolderIcon = () => {
    switch (folder.name) {
      case 'Books':
        return <Book className="h-10 w-10 text-memoquiz-purple" />;
      case 'Diary':
        return <PenSquare className="h-10 w-10 text-memoquiz-purple" />;
      default:
        return <FileText className="h-10 w-10 text-memoquiz-purple" />;
    }
  };
  
  return (
    <Link to={`/folders/${folder.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow border-2 hover:border-memoquiz-purple/20">
        <CardHeader className="pb-2 pt-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">{folder.name}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete folder</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center justify-center py-4">
            {getFolderIcon()}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {folder.description || `Folder with ${folder.notes.length} note(s)`}
          </p>
        </CardContent>
        <CardFooter className="pt-2 pb-4 flex justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <File className="h-3 w-3 mr-1" />
            {folder.notes.length} {folder.notes.length === 1 ? 'note' : 'notes'}
          </div>
          <Button size="sm" className="ml-auto">
            Open
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default FolderCard;
