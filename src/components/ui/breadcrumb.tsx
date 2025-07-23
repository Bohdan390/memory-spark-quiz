import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Folder, FileText, Brain } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { folders, currentFolder, currentNote } = useApp();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home
    breadcrumbs.push({
      label: 'Home',
      href: '/folders',
      icon: <Home className="h-4 w-4" />
    });

    if (pathSegments.length === 0) return breadcrumbs;

    // Handle different route patterns
    if (pathSegments[0] === 'folders') {
      if (pathSegments.length === 1) {
        // Just /folders
        breadcrumbs[0].label = 'Folders';
        return breadcrumbs;
      }

      // Get folder information
      const folderId = pathSegments[1];
      const folder = folders.find(f => f.id === folderId) || currentFolder;

      if (folder) {
        breadcrumbs.push({
          label: folder.name,
          href: `/folders/${folder.id}`,
          icon: <Folder className="h-4 w-4" />
        });

        // Handle nested routes like notes and quiz
        if (pathSegments.length > 2) {
          const action = pathSegments[2];
          
          if (action === 'notes' && pathSegments.length > 3) {
            // In a specific note
            const noteId = pathSegments[3];
            const note = folder.notes.find(n => n.id === noteId) || currentNote;
            
            if (note) {
              breadcrumbs.push({
                label: note.title || 'Untitled Note',
                icon: <FileText className="h-4 w-4" />
              });
            }
          } else if (action === 'quiz') {
            // In quiz mode
            breadcrumbs.push({
              label: 'Quiz',
              icon: <Brain className="h-4 w-4" />
            });
          }
        }
      }
    } else if (pathSegments[0] === 'recent') {
      breadcrumbs.push({
        label: 'Recent Notes',
        icon: <FileText className="h-4 w-4" />
      });
    } else if (pathSegments[0] === 'quizzes') {
      breadcrumbs.push({
        label: 'All Quizzes',
        icon: <Brain className="h-4 w-4" />
      });
    } else if (pathSegments[0] === 'about') {
      breadcrumbs.push({
        label: 'About',
        icon: <FileText className="h-4 w-4" />
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs if we only have the home item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1" />
            )}
            
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-1 hover:text-foreground transition-colors",
                  "hover:underline"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span 
                className={cn(
                  "flex items-center gap-1",
                  isLast && "text-foreground font-medium"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
