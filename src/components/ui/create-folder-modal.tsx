import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FolderPlus } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, description?: string) => Promise<void>;
  type?: 'journal' | 'work' | 'general';
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  type = 'general',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Get title and description based on type
  const getTitle = () => {
    switch (type) {
      case 'journal': return 'Create New Journal';
      case 'work': return 'Create New Work Folder';
      default: return 'Create New Folder';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'journal': return 'Create a new journal folder for your personal thoughts and experiences.';
      case 'work': return 'Create a new work folder for professional notes and project documentation.';
      default: return 'Create a new folder to organize your notes and content.';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'journal': return 'Enter journal name';
      case 'work': return 'Enter work folder name';
      default: return 'Enter folder name';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Folder name required',
        description: 'Please enter a name for your folder.',
        variant: 'destructive',
      });
      return;
    }

    if (name.trim().length > 100) {
      toast({
        title: 'Name too long',
        description: 'Folder name must be 100 characters or less.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await onCreateFolder(name.trim(), description.trim() || undefined);
      toast({
        title: 'Folder created',
        description: `Folder "${name.trim()}" has been created successfully.`,
      });
      handleClose();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <FolderPlus className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name *</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isCreating}
              maxLength={100}
              autoFocus
            />
            <div className="text-xs text-muted-foreground">
              {name.length}/100 characters
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="folder-description">Description (Optional)</Label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this folder is for..."
              disabled={isCreating}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Folder
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 