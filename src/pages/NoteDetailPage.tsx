import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import NoteEditor from '@/components/notes/NoteEditor';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const NoteDetailPage: React.FC = () => {
  const { folderId, noteId } = useParams<{ folderId: string; noteId: string }>();
  const navigate = useNavigate();
  const { getFolder, getNote, createNote, updateNote, deleteNote } = useApp();
  const { toast } = useToast();
  const [isNew] = useState(noteId === 'new');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
      try {
        const newNote = await createNote(folder.id, title, content);
        if (newNote) {
          navigate(`/folders/${folderId}`);
        }
      } catch (error) {
        console.error('Error creating note:', error);
        // Error handling is already done in the createNote function
      }
    } else if (note) {
      try {
        const success = await updateNote(folder.id, note.id, { title, content });
        if (success) {
          navigate(`/folders/${folderId}`);
        }
      } catch (error) {
        console.error('Error updating note:', error);
        // Error handling is already done in the updateNote function
      }
    }
  };
  
  const handleDeleteNote = () => {
    if (!note) return;
    setDeleteDialogOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!note) return;
    
    setIsDeleting(true);
    try {
      await deleteNote(folder.id, note.id);
      navigate(`/folders/${folderId}`);
      // The toast message is already handled in the deleteNote function
    } catch (error) {
      // Error handling is already done in the deleteNote function
      console.error('Error in handleDeleteNote:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{note?.title}"? This action cannot be undone and will also delete all quiz questions associated with this note.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteNote} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoteDetailPage;
