import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { SearchNotes } from '@/components/ui/search';

const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/folders" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-memoquiz-purple" />
            <span className="text-lg font-display font-bold">MemoQuiz</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <SearchNotes className="flex-1 max-w-md" />
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/folders" className="text-sm font-medium hover:text-memoquiz-purple transition-colors">
              Folders
            </Link>
            <Link to="/recent" className="text-sm font-medium hover:text-memoquiz-purple transition-colors">
              Recent Notes
            </Link>
            <Link to="/quizzes" className="text-sm font-medium hover:text-memoquiz-purple transition-colors">
              Quizzes
            </Link>
          </nav>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
