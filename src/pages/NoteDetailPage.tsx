import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import NoteEditor from '@/components/notes/NoteEditor';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';

const NoteDetailPage: React.FC = () => {
  const { folderId, noteId } = useParams<{ folderId: string; noteId: string }>();
  const navigate = useNavigate();
  const { getFolder, getNote, createNote, updateNote, deleteNote } = useApp();
  const { toast } = useToast();
  const [isNew] = useState(noteId === 'new');
  
  console.log('[NoteDetailPage] Loaded. folderId from URL:', folderId, 'noteId from URL:', noteId, 'isNew:', isNew);
  
  const folder = getFolder(folderId || '');
  console.log('[NoteDetailPage] Retrieved folder:', folder);
  
  const note = noteId !== 'new' ? getNote(folderId || '', noteId || '') : undefined;
  console.log('[NoteDetailPage] Retrieved note (should be undefined if new):', note);
  
  useEffect(() => {
    console.log('[NoteDetailPage] useEffect for note/isNew check. Current note:', note, 'isNew:', isNew);
    // If editing an existing note that doesn't exist, redirect back
    if (!isNew && !note) {
      toast({
        title: 'Note not found',
        description: 'The note you are trying to edit does not exist',
        variant: 'destructive'
      });
    }
  }, [isNew, note, folderId, navigate, toast]);

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
  
  const handleSaveNote = async (title: string, content: string) => {
    if (isNew) {
      createNote(folder.id, title, content);
      navigate(`/folders/${folderId}`);
    } else if (note) {
     const success = await updateNote(folder.id, note.id, { title, content });
     if (success) {
      navigate(`/folders/${folderId}`);
     }
    }
  };
  
  const handleDeleteNote = () => {
    if (!note) return;
    
    if (confirm(`Are you sure you want to delete the note "${note.title}"?`)) {
      deleteNote(folder.id, note.id);
      navigate(`/folders/${folderId}`);
      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted successfully'
      });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(`/folders/${folderId}`)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {folder.name}
          </Button>
        </div>
        
        {!isNew && note && (
          <Button variant="ghost" onClick={handleDeleteNote} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete Note
          </Button>
        )}
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {isNew ? 'Create New Note' : 'Edit Note'}
        </h1>
        <p className="text-muted-foreground">
          {isNew ? `Adding a new note to ${folder.name}` : `Editing a note in ${folder.name}`}
        </p>
      </div>
      
      <NoteEditor
        initialNote={note}
        folderId={folder.id}
        onSave={handleSaveNote}
        isNewNote={isNew}
        folderName={folder.name}
      />
    </div>
  );
};

export default NoteDetailPage;
