import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Note } from '@/types/models';
import { 
  SaveIcon, Bold, Italic, Underline, List, Heading1, Heading2, Heading3, 
  ListOrdered, Quote, Code, Undo, Redo, Link as LinkIcon, Highlighter, 
  ListTodo, Strikethrough 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  initialNote?: Note;
  folderId: string;
  onSave: (title: string, content: string) => void;
  isNewNote: boolean;
  folderName: string;
}

const ToolbarButton = ({ 
  onClick, 
  icon, 
  label, 
  shortcut, 
  isActive, 
  disabled 
}: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  shortcut?: string; 
  isActive?: boolean;
  disabled?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-8 w-8 p-0",
          isActive && "bg-accent text-accent-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{label}</p>
      {shortcut && <p className="text-xs text-muted-foreground">{shortcut}</p>}
    </TooltipContent>
  </Tooltip>
);

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  initialNote, 
  folderId, 
  onSave, 
  isNewNote, 
  folderName 
}) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your thoughts here... Use ## for headings, * for bold, - for lists...',
      }),
      Typography,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CharacterCount,
    ],
    content: initialNote?.content || '',
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(true);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-stone dark:prose-invert max-w-none min-h-[calc(100vh-350px)] p-4 focus:outline-none',
          'text-base leading-relaxed',
          'font-serif'
        ),
      },
    },
  });

  const handleAutoSave = useCallback(() => {
    if (!editor) return;
    
    const content = editor.getHTML();
    if (title.trim() && content.trim()) {
      onSave(title, content);
      setHasUnsavedChanges(false);
      toast({ 
        title: 'Auto-saved', 
        description: 'Your changes have been automatically saved.', 
        duration: 2000 
      });
    }
  }, [editor, title, onSave, toast]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editor) return;

    if (title.trim() === '') {
      toast({ 
        title: 'Title is required', 
        description: 'Please enter a title for your note', 
        variant: 'destructive' 
      });
      return;
    }

    const content = editor.getHTML();
    onSave(title, content);
    setHasUnsavedChanges(false);
    toast({ 
      title: 'Note saved', 
      description: `Note "${title}" has been saved successfully.`, 
      duration: 3000 
    });
  }, [editor, title, onSave, toast]);

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !editor) return;

    const autoSaveTimer = setTimeout(() => {
      if (title.trim() && editor.getText().trim()) {
        handleAutoSave();
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, title, editor, handleAutoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-1">
          {isNewNote ? `New note in ${folderName}` : `Editing in ${folderName}`}
          {hasUnsavedChanges && <span className="ml-2 text-orange-500">• Unsaved changes</span>}
        </p>
        <Input
          placeholder="Untitled Note"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasUnsavedChanges(true);
          }}
          className="text-3xl md:text-4xl font-bold h-auto p-0 border-none focus-visible:ring-0 shadow-none !bg-transparent tracking-tight"
          autoFocus={isNewNote}
          aria-label="Note title"
          aria-required="true"
        />
      </div>

      {/* Toolbar */}
      <div className="sticky top-[60px] z-10 bg-background/95 backdrop-blur-sm rounded-lg border p-3 mb-4 shadow-sm">
        <div className="flex items-center space-x-1 flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleBold().run()} 
              icon={<Bold className="h-4 w-4" />} 
              label="Bold" 
              shortcut="Ctrl+B"
              isActive={editor.isActive('bold')}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleItalic().run()} 
              icon={<Italic className="h-4 w-4" />} 
              label="Italic" 
              shortcut="Ctrl+I"
              isActive={editor.isActive('italic')}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleStrike().run()} 
              icon={<Strikethrough className="h-4 w-4" />} 
              label="Strikethrough"
              isActive={editor.isActive('strike')}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleHighlight().run()} 
              icon={<Highlighter className="h-4 w-4" />} 
              label="Highlight"
              isActive={editor.isActive('highlight')}
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <div className="flex items-center space-x-1">
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
              icon={<Heading1 className="h-4 w-4" />} 
              label="Heading 1"
              isActive={editor.isActive('heading', { level: 1 })}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
              icon={<Heading2 className="h-4 w-4" />} 
              label="Heading 2"
              isActive={editor.isActive('heading', { level: 2 })}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
              icon={<Heading3 className="h-4 w-4" />} 
              label="Heading 3"
              isActive={editor.isActive('heading', { level: 3 })}
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <div className="flex items-center space-x-1">
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleBulletList().run()} 
              icon={<List className="h-4 w-4" />} 
              label="Bullet List"
              isActive={editor.isActive('bulletList')}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleOrderedList().run()} 
              icon={<ListOrdered className="h-4 w-4" />} 
              label="Numbered List"
              isActive={editor.isActive('orderedList')}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleTaskList().run()} 
              icon={<ListTodo className="h-4 w-4" />} 
              label="Task List"
              isActive={editor.isActive('taskList')}
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Other Formatting */}
          <div className="flex items-center space-x-1">
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleBlockquote().run()} 
              icon={<Quote className="h-4 w-4" />} 
              label="Blockquote"
              isActive={editor.isActive('blockquote')}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().toggleCode().run()} 
              icon={<Code className="h-4 w-4" />} 
              label="Inline Code"
              isActive={editor.isActive('code')}
            />
            <ToolbarButton 
              onClick={setLink} 
              icon={<LinkIcon className="h-4 w-4" />} 
              label="Add Link"
              isActive={editor.isActive('link')}
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <ToolbarButton 
              onClick={() => editor.chain().focus().undo().run()} 
              icon={<Undo className="h-4 w-4" />} 
              label="Undo"
              shortcut="Ctrl+Z"
              disabled={!editor.can().undo()}
            />
            <ToolbarButton 
              onClick={() => editor.chain().focus().redo().run()} 
              icon={<Redo className="h-4 w-4" />} 
              label="Redo"
              shortcut="Ctrl+Y"
              disabled={!editor.can().redo()}
            />
          </div>

          <div className="flex-grow" />

          {/* Save Button */}
          <Button 
            onClick={handleSubmit} 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <SaveIcon className="mr-2 h-4 w-4" /> 
            Save Note
            {hasUnsavedChanges && <span className="ml-1">*</span>}
          </Button>
        </div>

        {/* Markdown Hints */}
        <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
          <span className="font-medium">Quick shortcuts:</span> 
          <span className="ml-2">Type ## for heading, * for bold, - for list, [] for task, &gt; for quote</span>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <EditorContent 
          editor={editor} 
          className="min-h-[calc(100vh-350px)]"
        />
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div>
          {editor.storage.characterCount.characters()} characters, {' '}
          {editor.storage.characterCount.words()} words
        </div>
        <div>
          Auto-save: {hasUnsavedChanges ? 'Pending...' : 'Up to date'}
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;

