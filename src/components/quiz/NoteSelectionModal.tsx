import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Note } from '@/types/models';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { stripHtmlAndMarkdown } from '@/lib/utils';

interface NoteSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onConfirm: (selectedNoteIds: string[]) => void;
  isLoading?: boolean;
}

const NoteSelectionModal: React.FC<NoteSelectionModalProps> = ({
  isOpen,
  onClose,
  notes,
  onConfirm,
  isLoading = false
}) => {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  const handleNoteToggle = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotes.length === notes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(notes.map(note => note.id));
    }
  };

  const handleConfirm = () => {
    if (selectedNotes.length > 0) {
      onConfirm(selectedNotes);
    }
  };

  const handleClose = () => {
    setSelectedNotes([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Notes for Quiz Generation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Select which notes to use for generating quiz questions.
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedNotes.length === notes.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {notes.map((note) => (
                <Card key={note.id} style={{cursor: 'pointer'}} className="border-2 hover:border-primary/50 transition-colors" onClick={() => handleNoteToggle(note.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={note.id}
                        checked={selectedNotes.includes(note.id)}
                        onCheckedChange={() => handleNoteToggle(note.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={note.id}
                          className="text-sm font-medium cursor-pointer line-clamp-1"
                        >
                          {note.title}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {stripHtmlAndMarkdown(note.content).substring(0, 150)}
                          {stripHtmlAndMarkdown(note.content).length > 150 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground">
            Selected {selectedNotes.length} of {notes.length} notes
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedNotes.length === 0 || isLoading}
          >
            {isLoading ? 'Generating...' : `Generate Quiz (${selectedNotes.length} notes)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteSelectionModal; 