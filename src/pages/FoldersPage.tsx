
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Briefcase, Search, Folder as FolderIcon, Trash2, Edit, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { CreateFolderModal } from '@/components/ui/create-folder-modal';

const FoldersPage = () => {
  const navigate = useNavigate();
  const { folders, createFolder, deleteFolder, updateFolder } = useApp();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'journal' | 'work' | 'general'>('general');

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

  const handleCreateJournalFolder = () => {
    setCreateModalType('journal');
    setIsCreateModalOpen(true);
  };

  const handleCreateWorkFolder = () => {
    setCreateModalType('work');
    setIsCreateModalOpen(true);
  };

  const handleCreateGeneralFolder = () => {
    setCreateModalType('general');
    setIsCreateModalOpen(true);
  };

  const handleCreateFolder = async (name: string, description?: string) => {
    let finalName = name;
    let finalDescription = description;

    // Pre-fill based on type if no description provided
    if (!finalDescription) {
      switch (createModalType) {
        case 'journal':
          finalDescription = 'Personal journal entries and thoughts';
          break;
        case 'work':
          finalDescription = 'Professional notes and project documentation';
          break;
        default:
          finalDescription = 'General purpose folder';
      }
    }

    const newFolder = await createFolder(finalName, finalDescription);
    
    if (newFolder) {
      navigate(`/folders/${newFolder.id}`);
    }
  };

  const handleDeleteFolder = (folder: any) => {
    setSelectedFolder(folder);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFolder = async () => {
    if (!selectedFolder) return;
    
    setIsDeleting(true);
    try {
      await deleteFolder(selectedFolder.id);
      toast({
        title: 'Folder deleted',
        description: `"${selectedFolder.name}" has been deleted successfully`
      });
      setDeleteDialogOpen(false);
      setSelectedFolder(null);
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

  const handleEditFolder = (folder: any) => {
    setSelectedFolder(folder);
    setEditName(folder.name);
    setEditDescription(folder.description || '');
    setEditDialogOpen(true);
  };

  const confirmEditFolder = async () => {
    if (!selectedFolder || !editName.trim()) return;
    
    setIsEditing(true);
    try {
      await updateFolder(selectedFolder.id, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      toast({
        title: 'Folder updated',
        description: `"${editName}" has been updated successfully`
      });
      setEditDialogOpen(false);
      setSelectedFolder(null);
      setEditName('');
      setEditDescription('');
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

  const getNotesCount = (folder: any) => {
    return folder.notes ? folder.notes.length : 0;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Knowledge Base</h1>
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
            <h2 className="text-xl font-display font-semibold">Journal Entries</h2>
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
            onDelete={handleDeleteFolder}
            onEdit={handleEditFolder}
          />
        </TabsContent>

        <TabsContent value="work" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold">Work Notes</h2>
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
            onDelete={handleDeleteFolder}
            onEdit={handleEditFolder}
          />
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold">Other Folders</h2>
            <Button onClick={handleCreateGeneralFolder}>
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
            onDelete={handleDeleteFolder}
            onEdit={handleEditFolder}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFolder?.name}"? This action cannot be undone and will also delete all notes and quiz questions in this folder.
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
      
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateFolder={handleCreateFolder}
        type={createModalType}
      />
    </div>
  );
};

interface FolderGridProps {
  folders: any[];
  getNotesCount: (folder: any) => number;
  navigate: (path: string) => void;
  type: 'journal' | 'work' | 'other';
  emptyMessage: string;
  onDelete: (folder: any) => void;
  onEdit: (folder: any) => void;
}

const FolderGrid: React.FC<FolderGridProps> = ({ 
  folders, 
  getNotesCount, 
  navigate, 
  type, 
  emptyMessage,
  onDelete,
  onEdit
}) => {
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
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => navigate(`/folders/${folder.id}`)}
              >
                {getIcon()}
                <div className="flex-1">
                  <CardTitle className="text-lg font-display line-clamp-1">{folder.name}</CardTitle>
                  <Badge variant={getBadgeVariant()} className="mt-1">
                    {type}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(folder)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(folder)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent 
            className="pt-0 cursor-pointer"
            onClick={() => navigate(`/folders/${folder.id}`)}
          >
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
