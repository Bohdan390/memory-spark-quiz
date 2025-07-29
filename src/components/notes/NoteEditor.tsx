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
  SaveIcon, Bold, Italic, List, Heading1, Heading2, Heading3, 
  ListOrdered, Quote, Code, Undo, Redo, Link as LinkIcon, Highlighter, 
  ListTodo, Strikethrough 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import VoiceInput from './VoiceInput';

interface NoteEditorProps {
  initialNote?: Note;
  folderId: string;
  onSave: (title: string, content: string) => Promise<void> | void;
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
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-8 w-8 p-0",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <div className="flex flex-col items-center">
        <span>{label}</span>
        {shortcut && <span className="text-xs text-muted-foreground">{shortcut}</span>}
      </div>
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
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Handle voice input text
  const handleVoiceText = (text: string) => {
    if (editor) {
      // Insert the transcribed text at the current cursor position
      editor.chain().focus().insertContent(text + ' ').run();
      setHasUnsavedChanges(true);
    }
  };

  // Prevent navigation while saving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = 'Note is currently being saved. Please wait...';
        return 'Note is currently being saved. Please wait...';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving]);

  // Text limits to prevent OpenAI rate limiting issues
  const MAX_CHARACTERS = 8000; // Conservative limit for OpenAI API
  const MAX_WORDS = 1500; // Conservative word limit
  const MAX_TITLE_LENGTH = 200; // Title character limit
  const WARNING_CHARACTERS = 6000; // Show warning at 75% of limit
  const WARNING_WORDS = 1200; // Show warning at 80% of word limit
  const WARNING_TITLE_LENGTH = 150; // Show warning at 75% of title limit

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
        placeholder: `Start writing your thoughts here... Use ## for headings, * for bold, - for lists... (Limit: ${MAX_WORDS.toLocaleString()} words, ${MAX_CHARACTERS.toLocaleString()} characters)`,
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
      CharacterCount.configure({
        limit: MAX_CHARACTERS,
      }),
    ],
    content: initialNote?.content || '',
    onUpdate: () => {
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

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editor || isSaving) return;

    if (title.trim() === '') {
      toast({ 
        title: 'Title is required',
        description: 'Please enter a title for your note',
        variant: 'destructive'
      });
      return;
    }

    if (title.length > MAX_TITLE_LENGTH) {
      toast({ 
        title: 'Title too long',
        description: `Title exceeds ${MAX_TITLE_LENGTH} character limit. Please shorten your title.`,
        variant: 'destructive'
      });
      return;
    }

    const content = editor.getHTML();
    const characterCount = editor.storage.characterCount.characters();
    const wordCount = editor.storage.characterCount.words();

    // Check character limit
    if (characterCount > MAX_CHARACTERS) {
      toast({ 
        title: 'Note too long',
        description: `Note exceeds ${MAX_CHARACTERS.toLocaleString()} character limit. Please shorten your note to avoid API rate limits.`,
        variant: 'destructive'
      });
      return;
    }

    // Check word limit
    if (wordCount > MAX_WORDS) {
      toast({ 
        title: 'Note too long',
        description: `Note exceeds ${MAX_WORDS.toLocaleString()} word limit. Please shorten your note to avoid API rate limits.`,
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(title, content);
      setHasUnsavedChanges(false);
      // The toast message is already handled in the createNote/updateNote functions
    } catch (error) {
      console.error('Error saving note:', error);
      // Don't reset hasUnsavedChanges on error so user can try again
    } finally {
      setIsSaving(false);
    }
    
  }, [editor, title, onSave, toast, isSaving]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!isSaving) {
          handleSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, isSaving]);

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
        <div className="relative">
          <Input
            placeholder="Untitled Note"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className={cn(
              "text-3xl md:text-4xl font-bold h-auto p-0 border-none focus-visible:ring-0 shadow-none !bg-transparent tracking-tight",
              title.length > MAX_TITLE_LENGTH && "text-red-500",
              title.length > WARNING_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH && "text-orange-500"
            )}
            autoFocus={isNewNote}
            aria-label="Note title"
            aria-required="true"
          />
          {title.length > WARNING_TITLE_LENGTH && (
            <div className="absolute -bottom-6 right-0 text-xs text-muted-foreground">
              {title.length}/{MAX_TITLE_LENGTH}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card border rounded-lg p-2">
        <div className="flex items-center space-x-1">
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
              label="Ordered List"
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

          {/* Voice Input */}
          <VoiceInput 
            onTextChange={handleVoiceText}
            disabled={!editor}
            size="sm"
          />

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
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <SaveIcon className={cn("mr-2 h-4 w-4", isSaving && "animate-spin")} /> 
            {isSaving ? "Saving..." : "Save Note"}
            {hasUnsavedChanges && !isSaving && <span className="ml-1">*</span>}
          </Button>
        </div>

        {/* Markdown Hints */}
        <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
          <span className="font-medium">Quick shortcuts:</span> 
          <span className="ml-2">Type ## for heading, * for bold, - for list, [] for task, &gt; for quote</span>
        </div>
      </div>

      {/* Warning Messages */}
      {(editor.storage.characterCount.characters() > WARNING_CHARACTERS || editor.storage.characterCount.words() > WARNING_WORDS) && (
        <div className={cn(
          "p-3 rounded-lg border text-sm font-medium",
          editor.storage.characterCount.characters() > MAX_CHARACTERS || editor.storage.characterCount.words() > MAX_WORDS
            ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200"
            : "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200"
        )}>
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>
              {editor.storage.characterCount.characters() > MAX_CHARACTERS || editor.storage.characterCount.words() > MAX_WORDS
                ? "Note exceeds limits and cannot be saved. Please shorten your content."
                : "Approaching text limits. Consider shortening your note to avoid API rate limits when generating quizzes."
              }
            </span>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className={cn(
        "bg-card border rounded-lg shadow-sm overflow-hidden",
        editor.storage.characterCount.characters() > MAX_CHARACTERS && "border-red-500 border-2",
        editor.storage.characterCount.characters() > WARNING_CHARACTERS && editor.storage.characterCount.characters() <= MAX_CHARACTERS && "border-orange-500 border-2",
        editor.storage.characterCount.words() > MAX_WORDS && "border-red-500 border-2",
        editor.storage.characterCount.words() > WARNING_WORDS && editor.storage.characterCount.words() <= MAX_WORDS && "border-orange-500 border-2"
      )}>
        <EditorContent 
          editor={editor} 
          className="min-h-[calc(100vh-350px)]"
        />
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-1",
            editor.storage.characterCount.characters() > MAX_CHARACTERS && "text-red-500 font-medium",
            editor.storage.characterCount.characters() > WARNING_CHARACTERS && editor.storage.characterCount.characters() <= MAX_CHARACTERS && "text-orange-500"
          )}>
            <span>{editor.storage.characterCount.characters().toLocaleString()}</span>
            <span>/</span>
            <span>{MAX_CHARACTERS.toLocaleString()}</span>
            <span>characters</span>
          </div>
          <div className={cn(
            "flex items-center gap-1",
            editor.storage.characterCount.words() > MAX_WORDS && "text-red-500 font-medium",
            editor.storage.characterCount.words() > WARNING_WORDS && editor.storage.characterCount.words() <= MAX_WORDS && "text-orange-500"
          )}>
            <span>{editor.storage.characterCount.words().toLocaleString()}</span>
            <span>/</span>
            <span>{MAX_WORDS.toLocaleString()}</span>
            <span>words</span>
          </div>
          {(editor.storage.characterCount.characters() > WARNING_CHARACTERS || editor.storage.characterCount.words() > WARNING_WORDS) && (
            <div className="text-orange-500 font-medium">
              ⚠️ Approaching limit
            </div>
          )}
        </div>
        <div>
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;

