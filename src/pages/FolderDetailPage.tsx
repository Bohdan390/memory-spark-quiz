
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import NoteCard from '@/components/notes/NoteCard';
import NoteSelectionModal from '@/components/quiz/NoteSelectionModal';
import { Plus, BookOpen, BrainCircuit, FileText, PenSquare, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const FolderDetailPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { folders, getFolder, createNote, deleteNote, generateQuiz, isGeneratingQuiz } = useApp();
  const { toast } = useToast();
  const [isNoteSelectionModalOpen, setIsNoteSelectionModalOpen] = useState(false);
  
  const folder = getFolder(folderId || '');
  
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
  
  const handleCreateNote = () => {
    navigate(`/folders/${folderId}/notes/new`);
  };
  
  const handleDeleteNote = (noteId: string) => {
    deleteNote(folder.id, noteId);
    toast({
      title: 'Note deleted',
      description: 'Your note has been deleted successfully'
    });
  };
  
  const handleStartQuiz = () => {
    navigate(`/folders/${folderId}/quiz`);
  };
  
  const handleGenerateQuiz = () => {
    if (!folderId || !folder || folder.notes.length === 0) return;
    
    setIsNoteSelectionModalOpen(true);
  };

  const handleConfirmNoteSelection = async (selectedNoteIds: string[]) => {
    if (!folderId) return;
    
    try {
      const questions = await generateQuiz(folderId, selectedNoteIds);
      if (questions.length > 0) {
        toast({
          title: 'Quiz Generated!',
          description: `Successfully generated ${questions.length} questions from ${selectedNoteIds.length} selected notes. Click "Start Quiz" to begin.`
        });
      }
      setIsNoteSelectionModalOpen(false);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate quiz questions. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const getFolderIcon = () => {
    switch (folder.name) {
      case 'Books':
        return <BookOpen className="h-8 w-8 text-memoquiz-purple" />;
      case 'Diary':
        return <PenSquare className="h-8 w-8 text-memoquiz-purple" />;
      default:
        return <FileText className="h-8 w-8 text-memoquiz-purple" />;
    }
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
        <div className="flex items-center gap-3">
          {getFolderIcon()}
          <h1 className="text-3xl font-bold tracking-tight">{folder.name}</h1>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleCreateNote}>
            <Plus className="mr-2 h-4 w-4" /> New Note
          </Button>
          <Button 
            onClick={handleGenerateQuiz}
            variant="secondary"
            disabled={folder.notes.length === 0 || isGeneratingQuiz}
            className="bg-memoquiz-purple hover:bg-memoquiz-purple/90 text-white"
          >
            <BrainCircuit className="mr-2 h-4 w-4" /> 
            {isGeneratingQuiz ? 'Generating...' : 'Generate Quiz'}
          </Button>
          <Button 
            onClick={handleStartQuiz}
            variant="outline"
            disabled={folder.notes.length === 0}
          >
            <BrainCircuit className="mr-2 h-4 w-4" /> Start Quiz
          </Button>
          <Button 
            onClick={() => navigate(`/folders/${folderId}/manage`)}
            variant="secondary"
          >
            <Settings className="mr-2 h-4 w-4" /> Manage Quiz
          </Button>
        </div>
      </div>
      
      {folder.notes.length === 0 ? (
        <div className="text-center py-10 border rounded-md bg-muted/30">
          <p className="text-muted-foreground mb-4">This folder is empty. Add your first note!</p>
          <Button onClick={handleCreateNote}>
            <Plus className="mr-2 h-4 w-4" /> Create Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {folder.notes.map(note => (
            <NoteCard 
              key={note.id} 
              note={note} 
              folderId={folder.id}
              onDelete={handleDeleteNote} 
            />
          ))}
        </div>
      )}

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

export default FolderDetailPage;
