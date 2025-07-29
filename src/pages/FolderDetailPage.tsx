
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import NoteCard from '@/components/notes/NoteCard';
import NoteSelectionModal from '@/components/quiz/NoteSelectionModal';
import { Plus, BookOpen, BrainCircuit, FileText, PenSquare, Settings, Trash2, Edit, MoreVertical, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

const FolderDetailPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { folders, getFolder, createNote, deleteNote, generateQuiz, isGeneratingQuiz, deleteFolder, updateFolder } = useApp();
  const { toast } = useToast();
  const [isNoteSelectionModalOpen, setIsNoteSelectionModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
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
  
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(folder.id, noteId);
      // The toast message is already handled in the deleteNote function
    } catch (error) {
      // Error handling is already done in the deleteNote function
      console.error('Error in handleDeleteNote:', error);
    }
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

  const handleDeleteFolder = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFolder = async () => {
    setIsDeleting(true);
    try {
      await deleteFolder(folder.id);
      toast({
        title: 'Folder deleted',
        description: `"${folder.name}" has been deleted successfully`
      });
      navigate('/folders');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete folder. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditFolder = () => {
    setEditName(folder.name);
    setEditDescription(folder.description || '');
    setEditDialogOpen(true);
  };

  const confirmEditFolder = async () => {
    if (!editName.trim()) return;
    
    setIsEditing(true);
    try {
      await updateFolder(folder.id, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      toast({
        title: 'Folder updated',
        description: `"${editName}" has been updated successfully`
      });
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update folder. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsEditing(false);
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
          <h1 className="text-3xl font-display font-bold tracking-tight">{folder.name}</h1>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDeleting || isEditing}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditFolder} disabled={isEditing}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Folder
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDeleteFolder}
                className="text-destructive"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{folder.name}"? This action cannot be undone and will also delete all notes and quiz questions in this folder.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFolder} disabled={isDeleting}>
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

      {/* Edit Folder Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update the folder name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="folder-name" className="text-sm font-medium">
                Folder Name
              </label>
              <Input
                id="folder-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter folder name"
                className="mt-1"
                disabled={isEditing}
              />
            </div>
            <div>
              <label htmlFor="folder-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="folder-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter folder description"
                className="mt-1"
                disabled={isEditing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
              Cancel
            </Button>
            <Button onClick={confirmEditFolder} disabled={!editName.trim() || isEditing}>
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FolderDetailPage;
