import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Heart, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Plus, 
  MoreHorizontal,
  Trash2,
  Edit,
  Star,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { useTimeline, type TimelineFilters } from '@/hooks/useTimeline';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TimelineFiltersComponent } from '@/components/timeline/TimelineFilters';
import { BulkActionModal } from '@/components/timeline/BulkActionModal';
import { CaptureModal } from '@/components/modals/CaptureModal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingCard, LoadingGrid } from '@/components/ui/loading-card';
import { formatDistanceToNow, format, endOfDay, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import type { MomentWithRelations } from '@/lib/db/types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePeople } from '@/hooks/usePeople';
import { useCategories } from '@/hooks/useCategories';

export const Timeline: React.FC = () => {
  const { isDiscreetMode } = useDiscreetMode();
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { people } = usePeople();
  const { categories } = useCategories();
  
  // Debounced search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Initialize filters from URL parameters
  const getInitialFilters = (): TimelineFilters => {
    const filters: TimelineFilters = {};
    
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const range = searchParams.get('range');
    const action = searchParams.get('action');
    const significant = searchParams.get('significant');
    const q = searchParams.get('q');
    const categoryId = searchParams.get('categoryId');
    const personId = searchParams.get('personId');
    
    // Handle single date with range=day (from trends drill-down)
    if (date && range === 'day') {
      const selectedDate = new Date(date);
      filters.dateRange = {
        from: startOfDay(selectedDate),
        to: endOfDay(selectedDate)
      };
    } else if (from && to) {
      filters.dateRange = {
        from: new Date(from),
        to: endOfDay(new Date(to)) // Make "to" date inclusive
      };
    }
    
    if (action && action !== 'both') filters.action = action as 'given' | 'received';
    if (significant === '1') filters.significance = true;
    if (q) filters.search = q;
    if (categoryId) filters.categoryId = categoryId;
    if (personId) filters.personId = personId;
    
    return filters;
  };
  
  // Applied filters (what's sent to the query)
  const [appliedFilters, setAppliedFilters] = useState<TimelineFilters>(getInitialFilters);
  
  // Draft filters (local UI state buffer)
  const [draftFilters, setDraftFilters] = useState<TimelineFilters>(appliedFilters);
  
  const [selectedMoments, setSelectedMoments] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  // Update draft filters when search query changes
  useEffect(() => {
    setDraftFilters(prev => ({ ...prev, search: debouncedSearch || undefined }));
  }, [debouncedSearch]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize search from URL
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
      setDebouncedSearch(q);
    }
  }, []);

  const { 
    moments, 
    isLoading, 
    hasNextPage, 
    isFetchingNextPage,
    fetchNextPage,
    bulkUpdate,
    isBulkUpdating,
    deleteMoment,
    isDeleting 
  } = useTimeline(appliedFilters);

  // Apply filters and update URL
  const handleApplyFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    if (draftFilters.dateRange?.from) {
      params.set('from', format(draftFilters.dateRange.from, 'yyyy-MM-dd'));
    }
    if (draftFilters.dateRange?.to) {
      // Store the original date (not end of day) in URL for readability
      params.set('to', format(startOfDay(draftFilters.dateRange.to), 'yyyy-MM-dd'));
    }
    if (draftFilters.action) params.set('action', draftFilters.action);
    if (draftFilters.significance) params.set('significant', '1');
    if (draftFilters.search) params.set('q', draftFilters.search);
    if (draftFilters.categoryId) params.set('categoryId', draftFilters.categoryId);
    if (draftFilters.personId) params.set('personId', draftFilters.personId);
    
    setSearchParams(params, { replace: true });
    setAppliedFilters(draftFilters);
  }, [draftFilters, setSearchParams]);

  // Reset filters to what's currently applied (from URL)
  const handleResetFilters = useCallback(() => {
    setDraftFilters(appliedFilters);
    const q = searchParams.get('q');
    setSearchQuery(q || '');
    setDebouncedSearch(q || '');
  }, [appliedFilters, searchParams]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setDraftFilters({});
    setSearchQuery('');
    setDebouncedSearch('');
    setSearchParams(new URLSearchParams(), { replace: true });
    setAppliedFilters({});
  }, [setSearchParams]);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    () => setCaptureOpen(true),
    () => searchRef.current?.focus()
  );

  // Check if filters have changed from applied state
  const hasUnappliedChanges = useMemo(() => {
    return JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
  }, [draftFilters, appliedFilters]);

  // Generate filter summary
  const filterSummary = useMemo(() => {
    const parts = [];
    
    if (appliedFilters.dateRange) {
      const { from, to } = appliedFilters.dateRange;
      if (format(from, 'yyyy-MM-dd') === format(startOfDay(to), 'yyyy-MM-dd')) {
        parts.push(format(from, 'MMM d'));
      } else {
        parts.push(`${format(from, 'MMM d')} - ${format(startOfDay(to), 'MMM d')}`);
      }
    }
    
    if (appliedFilters.action) {
      parts.push(appliedFilters.action === 'given' ? 'Given' : 'Received');
    }
    
    if (appliedFilters.significance) {
      parts.push('Significant');
    }
    
    if (appliedFilters.search) {
      parts.push(`q: ${appliedFilters.search}`);
    }
    
    if (appliedFilters.categoryId) {
      const category = categories.find(c => c.id === appliedFilters.categoryId);
      if (category) parts.push(`Category: ${category.name}`);
    }
    
    if (appliedFilters.personId) {
      const person = people.find(p => p.id === appliedFilters.personId);
      if (person) parts.push(`Person: ${person.display_name}`);
    }
    
    return parts.join(' • ');
  }, [appliedFilters, categories, people]);
  const handleSelectMoment = (momentId: string, selected: boolean) => {
    const newSelection = new Set(selectedMoments);
    if (selected) {
      newSelection.add(momentId);
    } else {
      newSelection.delete(momentId);
    }
    setSelectedMoments(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedMoments.size === moments.length) {
      setSelectedMoments(new Set());
    } else {
      setSelectedMoments(new Set(moments.map(m => m.id)));
    }
  };

  const handleBulkUpdate = (updates: any) => {
    const momentIds = Array.from(selectedMoments);
    bulkUpdate({ momentIds, updates });
    setSelectedMoments(new Set());
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderMoment = (moment: MomentWithRelations) => {
    const isSelected = selectedMoments.has(moment.id);
    
    return (
      <Card 
        key={moment.id} 
        className={`transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Selection Checkbox */}
            <div className="pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleSelectMoment(moment.id, checked === true)}
              />
            </div>

            {/* Type Indicator */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              moment.action === 'given' ? 'bg-primary/10' : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              {moment.action === 'given' ? (
                <ArrowUp className="h-5 w-5 text-primary" />
              ) : (
                <ArrowDown className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant={moment.action === 'given' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {moment.action === 'given' ? 'Given' : 'Received'}
                </Badge>
                
                {moment.category && (
                  <Badge variant="outline" className="text-xs">
                    {moment.category.name}
                  </Badge>
                )}
                
                {moment.significance && (
                  <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400">
                    <Star className="h-3 w-3 mr-1" />
                    Significant
                  </Badge>
                )}

                <span className="text-xs text-muted-foreground ml-auto" title={format(new Date(moment.happened_at), 'PPP p')}>
                  {formatDistanceToNow(new Date(moment.happened_at), { addSuffix: true })}
                </span>
              </div>

              {moment.description && (
              <p className="text-foreground mb-3">
                <DiscreetText text={moment.description} variant="body" />
              </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {moment.person && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-6 w-6">
                        {moment.person.avatar_type === 'emoji' && moment.person.avatar_value ? (
                          <div className="text-xs">{moment.person.avatar_value}</div>
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(moment.person.display_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>
                        <DiscreetText text={moment.person.display_name} variant="name" />
                      </span>
                    </div>
                  )}

                  {moment.tags && moment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {moment.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {moment.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{moment.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-semibold">Timeline</h1>
        </div>
        <div className="mb-6">
          <Card className="p-4">
            <div className="animate-pulse bg-muted rounded h-8 w-full"></div>
          </Card>
        </div>
        <LoadingGrid count={6} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl font-semibold">Timeline</h1>
          <div className="text-sm text-muted-foreground">
            {moments.length} {moments.length === 1 ? 'moment' : 'moments'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedMoments.size > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit {selectedMoments.size}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedMoments(new Set())}
              >
                Clear Selection
              </Button>
            </>
          )}
          <Button onClick={() => setCaptureOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Moment
          </Button>
        </div>
      </div>

      {/* Top Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search moments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter Summary */}
      {filterSummary && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filters:</span>
            <Badge variant="outline" className="text-xs">
              {filterSummary}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <TimelineFiltersComponent 
        filters={draftFilters}
        appliedFilters={appliedFilters}
        onFiltersChange={setDraftFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        hasUnappliedChanges={hasUnappliedChanges}
        className="mb-6"
      />

      {/* Bulk Selection Controls */}
      {moments.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {selectedMoments.size === moments.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedMoments.size === moments.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedMoments.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedMoments.size} selected
              </span>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            Tip: Use N for new moment, / to search, G+P/C/T/I to navigate
          </div>
        </div>
      )}

      {/* Timeline Entries */}
      {moments.length > 0 ? (
        <div className="space-y-4">
          {moments.map(renderMoment)}
          
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No moments found"
          description="Try adjusting your filters or create your first moment to get started."
          action={{
            label: "Create First Moment",
            onClick: () => setCaptureOpen(true)
          }}
        />
      )}

      {/* Modals */}
      <BulkActionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedMoments={moments.filter(m => selectedMoments.has(m.id))}
        onBulkUpdate={handleBulkUpdate}
        isUpdating={isBulkUpdating}
      />

      <CaptureModal 
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
      />
    </div>
  );
};