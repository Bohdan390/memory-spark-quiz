
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, PenSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { CreateFolderModal } from '@/components/ui/create-folder-modal';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { folders, createFolder } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateFolder = async (name: string, description?: string) => {
    await createFolder(name, description);
  };

  return (
    <div className="w-64 border-r bg-muted/40 overflow-y-auto h-[calc(100vh-4rem)] flex-shrink-0">
      <div className="p-4">
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full mb-4"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
        
        <div className="space-y-1">
          {folders.length > 0 ? (
            <>
              {/* Default Folders Section */}
              {folders.filter(folder => ['Books', 'Knowledge Hub', 'Diary'].includes(folder.name)).length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Default Folders</p>
                  
                  {folders.filter(folder => ['Books', 'Knowledge Hub', 'Diary'].includes(folder.name)).map(folder => (
                    <Link
                      key={folder.id}
                      to={`/folders/${folder.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                        location.pathname === `/folders/${folder.id}` && "bg-accent text-accent-foreground"
                      )}
                    >
                      {folder.name === 'Books' && <BookOpen className="h-4 w-4" />}
                      {folder.name === 'Knowledge Hub' && <FileText className="h-4 w-4" />}
                      {folder.name === 'Diary' && <PenSquare className="h-4 w-4" />}
                      <span>{folder.name}</span>
                      {folder.notes.length > 0 && (
                        <span className="ml-auto text-xs bg-muted rounded-full px-2 py-0.5">
                          {folder.notes.length}
                        </span>
                      )}
                    </Link>
                  ))}
                </>
              )}
              
              {/* Custom Folders Section */}
              {folders.filter(folder => !['Books', 'Knowledge Hub', 'Diary'].includes(folder.name)).length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground mt-6 mb-2 px-2">Custom Folders</p>
                  
                  {folders.filter(folder => !['Books', 'Knowledge Hub', 'Diary'].includes(folder.name)).map(folder => (
                    <Link
                      key={folder.id}
                      to={`/folders/${folder.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                        location.pathname === `/folders/${folder.id}` && "bg-accent text-accent-foreground"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{folder.name}</span>
                      {folder.notes.length > 0 && (
                        <span className="ml-auto text-xs bg-muted rounded-full px-2 py-0.5">
                          {folder.notes.length}
                        </span>
                      )}
                    </Link>
                  ))}
                </>
              )}
              
              {/* All Folders Section (if no default folders exist) */}
              {folders.filter(folder => ['Books', 'Knowledge Hub', 'Diary'].includes(folder.name)).length === 0 && 
               folders.filter(folder => !['Books', 'Knowledge Hub', 'Diary'].includes(folder.name)).length === 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-2">All Folders</p>
                  
                  {folders.map(folder => (
                    <Link
                      key={folder.id}
                      to={`/folders/${folder.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                        location.pathname === `/folders/${folder.id}` && "bg-accent text-accent-foreground"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{folder.name}</span>
                      {folder.notes.length > 0 && (
                        <span className="ml-auto text-xs bg-muted rounded-full px-2 py-0.5">
                          {folder.notes.length}
                        </span>
                      )}
                    </Link>
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No folders yet</p>
              <p className="text-xs text-muted-foreground">Create your first folder to get started</p>
            </div>
          )}
        </div>
      </div>
      
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
};

export default Sidebar;
