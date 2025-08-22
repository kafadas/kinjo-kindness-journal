import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Folder, Tag, ArrowRight, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { useCategories } from '@/hooks/useCategories';
import { CreateCategoryModal } from '@/components/modals/CreateCategoryModal';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingGrid } from '@/components/ui/loading-card';
import { CaptureModal } from '@/components/modals/CaptureModal';
import { formatDistanceToNow, subDays } from 'date-fns';

export const Categories: React.FC = () => {
  const navigate = useNavigate()
  const { categories, isLoading, deleteCategory, isDeleting } = useCategories()
  const { isDiscreetMode } = useDiscreetMode()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRange, setSelectedRange] = useState<'30' | '90'>('30')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [captureModalOpen, setCaptureModalOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/categories/${categoryId}`)
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setCategoryToDelete(null)
        }
      })
    }
  }

  const handleAddMoment = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setCaptureModalOpen(true)
  }

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate range for stats
  const rangeStart = subDays(new Date(), parseInt(selectedRange))
  const totalEntries = categories.reduce((sum, cat) => sum + (cat.entry_count || 0), 0)

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <LoadingGrid count={6} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-2">
            Categories
          </h1>
          <p className="text-muted-foreground">
            Organize your kindness moments
          </p>
        </div>
        <CreateCategoryModal />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={selectedRange} onValueChange={(value) => setSelectedRange(value as '30' | '90')}>
          <TabsList>
            <TabsTrigger value="30">Last 30 days</TabsTrigger>
            <TabsTrigger value="90">Last 90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {categories.length}
            </div>
            <div className="text-sm text-muted-foreground">Active Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {totalEntries}
            </div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {categories.length > 0 ? Math.max(...categories.map(cat => cat.entry_count || 0)) : 0}
            </div>
            <div className="text-sm text-muted-foreground">Most Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => {
            const displayName = category.name
            
            return (
              <Card 
                key={category.id}
                className="group hover:shadow-lg transition-all duration-200 hover:border-primary/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base cursor-pointer" onClick={() => handleCategoryClick(category.id)}>
                          <DiscreetText text={displayName} variant="name" />
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCategoryClick(category.id)}>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddMoment(category.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Moment
                            </DropdownMenuItem>
                            {!category.is_default && (
                              <>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {totalEntries > 0 ? Math.round(((category.entry_count || 0) / totalEntries) * 100) : 0}% of entries
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Last {selectedRange} days activity
                    </div>
                    
                    {/* Progress bar showing activity */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${totalEntries > 0 ? Math.min(((category.entry_count || 0) / totalEntries) * 100, 100) : 0}%` 
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category.entry_count || 0} entries</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleAddMoment(category.id)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : searchQuery ? (
        <EmptyState
          icon={Search}
          title="No categories found"
          description={`No categories match "${searchQuery}". Try a different search term.`}
        />
      ) : (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create categories to organize your kindness moments and track your journey."
          action={{
            label: "Create Your First Category",
            onClick: () => {}
          }}
        >
          <CreateCategoryModal 
            trigger={
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Category
              </Button>
            }
          />
        </EmptyState>
      )}

      {/* Modals */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <CaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        seedCategory={selectedCategoryId || undefined}
      />
    </div>
  )
}