import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Briefcase, Search, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { Category, EntryType } from '@/types/models';
import { electronDataService } from '@/services/electronDataService';

const CategoryList = () => {
  const navigate = useNavigate();
  const { categories, createCategory, entries } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const journalCategories = categories.filter(cat => cat.type === 'journal');
  const workCategories = categories.filter(cat => cat.type === 'work');

  const filteredJournalCategories = journalCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkCategories = workCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCategory = async (type: EntryType) => {
    const defaultNames = {
      journal: 'Personal Journal',
      work: 'Work Notes'
    };
    
    const newCategory = await createCategory(
      `${defaultNames[type]} ${Date.now()}`,
      type,
      `Your ${type} entries collection`
    );
    
    if (newCategory) {
      navigate(`/categories/${newCategory.id}`);
    }
  };

  const getEntriesCount = (categoryId: string) => {
    return entries.filter(entry => entry.categoryId === categoryId).length;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await electronDataService.exportData();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const success = await electronDataService.importData();
      if (success) {
        window.location.reload(); // Simple way to refresh data
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
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
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for Journal and Work */}
      <Tabs defaultValue="journal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Journal Entries ({journalCategories.length})
          </TabsTrigger>
          <TabsTrigger value="work" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Work Notes ({workCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Journal Categories</h2>
            <Button onClick={() => handleCreateCategory('journal')}>
              <Plus className="h-4 w-4 mr-2" />
              New Journal Category
            </Button>
          </div>
          
          <CategoryGrid 
            categories={filteredJournalCategories}
            getEntriesCount={getEntriesCount}
            navigate={navigate}
            type="journal"
          />
        </TabsContent>

        <TabsContent value="work" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Work Categories</h2>
            <Button onClick={() => handleCreateCategory('work')}>
              <Plus className="h-4 w-4 mr-2" />
              New Work Category
            </Button>
          </div>
          
          <CategoryGrid 
            categories={filteredWorkCategories}
            getEntriesCount={getEntriesCount}
            navigate={navigate}
            type="work"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface CategoryGridProps {
  categories: Category[];
  getEntriesCount: (categoryId: string) => number;
  navigate: (path: string) => void;
  type: EntryType;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, getEntriesCount, navigate, type }) => {
  const getIcon = () => {
    return type === 'journal' ? <BookOpen className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />;
  };

  const getEmptyMessage = () => {
    return type === 'journal' 
      ? "No journal categories yet. Create your first one to start recording your thoughts and experiences!"
      : "No work categories yet. Create your first one to organize your professional notes!";
  };

  if (categories.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center justify-center py-12">
          {getIcon()}
          <h3 className="text-lg font-medium mt-4 mb-2">
            No {type} categories
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            {getEmptyMessage()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Card
          key={category.id}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => navigate(`/categories/${category.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getIcon()}
                <div>
                  <CardTitle className="text-lg line-clamp-1">{category.name}</CardTitle>
                  <Badge variant={type === 'journal' ? 'default' : 'secondary'} className="mt-1">
                    {type}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {category.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {category.description}
              </p>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{getEntriesCount(category.id)} entries</span>
              <span>
                {new Date(category.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CategoryList; 