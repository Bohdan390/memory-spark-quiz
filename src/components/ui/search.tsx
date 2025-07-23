import React, { useState, useEffect, useRef } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Search, FileText, Folder, Clock } from 'lucide-react';
import { Note, Folder as FolderType } from '@/types/models';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchProps {
  className?: string;
}

export const SearchNotes: React.FC<SearchProps> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { folders } = useApp();
  const navigate = useNavigate();

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { notes: [], folders: [] };

    const query = searchQuery.toLowerCase();
    const foundNotes: (Note & { folderName: string })[] = [];
    const foundFolders: FolderType[] = [];

    folders.forEach(folder => {
      // Search in folder names
      if (folder.name.toLowerCase().includes(query) || 
          folder.description?.toLowerCase().includes(query)) {
        foundFolders.push(folder);
      }

      // Search in notes
      folder.notes.forEach(note => {
        if (note.title.toLowerCase().includes(query) || 
            note.content.toLowerCase().includes(query)) {
          foundNotes.push({ ...note, folderName: folder.name });
        }
      });
    });

    return { notes: foundNotes.slice(0, 10), folders: foundFolders.slice(0, 5) };
  }, [searchQuery, folders]);

  const handleSelectNote = (note: Note & { folderName: string }) => {
    navigate(`/folders/${note.folder_id}/notes/${note.id}`);
    setOpen(false);
    setSearchQuery('');
  };

  const handleSelectFolder = (folder: FolderType) => {
    navigate(`/folders/${folder.id}`);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-[0.5rem] text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
          className
        )}
        onClick={() => setOpen(true)}
        aria-label="Search notes and folders"
        role="searchbox"
      >
        <Search className="mr-2 h-4 w-4" aria-hidden="true" />
        <span className="hidden lg:inline-flex">Search notes...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search notes and folders..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {searchResults.folders.length > 0 && (
            <CommandGroup heading="Folders">
              {searchResults.folders.map((folder) => (
                <CommandItem
                  key={folder.id}
                  onSelect={() => handleSelectFolder(folder)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Folder className="h-4 w-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">{folder.name}</span>
                    {folder.description && (
                      <span className="text-xs text-muted-foreground">{folder.description}</span>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {folder.notes.length} notes
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults.notes.length > 0 && (
            <CommandGroup heading="Notes">
              {searchResults.notes.map((note) => (
                <CommandItem
                  key={note.id}
                  onSelect={() => handleSelectNote(note)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-green-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">{note.title}</span>
                    <span className="text-xs text-muted-foreground">
                      in {note.folderName}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {note.updatedAt.toLocaleDateString()}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}; 