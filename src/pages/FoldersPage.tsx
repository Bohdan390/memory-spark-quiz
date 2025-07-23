
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Briefcase, Search, Folder as FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';

const FoldersPage = () => {
  const navigate = useNavigate();
  const { folders, createFolder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Categorize folders by simulating journal vs work types
  const journalFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes('journal') ||
    folder.name.toLowerCase().includes('personal') ||
    folder.name.toLowerCase().includes('diary') ||
    folder.description?.toLowerCase().includes('journal') ||
    folder.description?.toLowerCase().includes('personal')
  );
  
  const workFolders = folders.filter(folder => 
    !journalFolders.includes(folder) && (
      folder.name.toLowerCase().includes('work') ||
      folder.name.toLowerCase().includes('project') ||
      folder.name.toLowerCase().includes('meeting') ||
      folder.description?.toLowerCase().includes('work') ||
      folder.description?.toLowerCase().includes('project')
    )
  );

  const otherFolders = folders.filter(folder => 
    !journalFolders.includes(folder) && !workFolders.includes(folder)
  );

  const filteredJournalFolders = journalFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkFolders = workFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOtherFolders = otherFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateJournalFolder = async () => {
    const newFolder = await createFolder(
      `Journal ${new Date().toLocaleDateString()}`,
      'Personal journal entries and thoughts'
    );
    
    if (newFolder) {
      navigate(`/folders/${newFolder.id}`);
    }
  };

  const handleCreateWorkFolder = async () => {
    const newFolder = await createFolder(
      `Work Notes ${new Date().toLocaleDateString()}`,
      'Professional notes and project documentation'
    );
    
    if (newFolder) {
      navigate(`/folders/${newFolder.id}`);
    }
  };

  const getNotesCount = (folder: any) => {
    return folder.notes ? folder.notes.length : 0;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Organize your journal entries and work notes, then quiz yourself to improve retention
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for different types */}
      <Tabs defaultValue="journal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Journal ({journalFolders.length})
          </TabsTrigger>
          <TabsTrigger value="work" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Work ({workFolders.length})
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-2">
            <FolderIcon className="h-4 w-4" />
            Other ({otherFolders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Journal Entries</h2>
            <Button onClick={handleCreateJournalFolder}>
              <Plus className="h-4 w-4 mr-2" />
              New Journal
            </Button>
          </div>
          
          <FolderGrid 
            folders={filteredJournalFolders}
            getNotesCount={getNotesCount}
            navigate={navigate}
            type="journal"
            emptyMessage="No journal folders yet. Create your first one to start recording your thoughts and experiences!"
          />
        </TabsContent>

        <TabsContent value="work" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Work Notes</h2>
            <Button onClick={handleCreateWorkFolder}>
              <Plus className="h-4 w-4 mr-2" />
              New Work Folder
            </Button>
          </div>
          
          <FolderGrid 
            folders={filteredWorkFolders}
            getNotesCount={getNotesCount}
            navigate={navigate}
            type="work"
            emptyMessage="No work folders yet. Create your first one to organize your professional notes!"
          />
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Other Folders</h2>
            <Button onClick={() => createFolder('New Folder', 'General purpose folder')}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
          
          <FolderGrid 
            folders={filteredOtherFolders}
            getNotesCount={getNotesCount}
            navigate={navigate}
            type="other"
            emptyMessage="No other folders yet. Create folders to organize any type of content!"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface FolderGridProps {
  folders: any[];
  getNotesCount: (folder: any) => number;
  navigate: (path: string) => void;
  type: 'journal' | 'work' | 'other';
  emptyMessage: string;
}

const FolderGrid: React.FC<FolderGridProps> = ({ folders, getNotesCount, navigate, type, emptyMessage }) => {
  const getIcon = () => {
    switch (type) {
      case 'journal': return <BookOpen className="h-6 w-6" />;
      case 'work': return <Briefcase className="h-6 w-6" />;
      default: return <FolderIcon className="h-6 w-6" />;
    }
  };

  const getBadgeVariant = () => {
    switch (type) {
      case 'journal': return 'default';
      case 'work': return 'secondary';
      default: return 'outline';
    }
  };

  if (folders.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center justify-center py-12">
          {getIcon()}
          <h3 className="text-lg font-medium mt-4 mb-2">
            No {type} folders
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {folders.map((folder) => (
        <Card
          key={folder.id}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => navigate(`/folders/${folder.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getIcon()}
                <div>
                  <CardTitle className="text-lg line-clamp-1">{folder.name}</CardTitle>
                  <Badge variant={getBadgeVariant()} className="mt-1">
                    {type}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {folder.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {folder.description}
              </p>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{getNotesCount(folder)} notes</span>
              <span>
                {new Date(folder.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FoldersPage;
