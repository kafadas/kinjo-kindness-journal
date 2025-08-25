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
import { formatRelativeDate } from '@/lib/formatters';
import { toast } from 'sonner';
import type { MomentWithRelations } from '@/lib/db/types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePeople } from '@/hooks/usePeople';
import { useCategories } from '@/hooks/useCategories';
import { RANGE_OPTIONS, getRangeLegacy, type DateRangeLabel } from '@/lib/dateRange';
import { cn } from '@/lib/utils';

export const Timeline: React.FC = () => {
  const { isDiscreetMode } = useDiscreetMode();
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { people } = usePeople();
  const { categories } = useCategories();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
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
    
    // Handle action filter from URL (from trends navigation)
    if (action === 'given' || action === 'received') {
      filters.action = action;
    }
    // Note: 'both' is the default (no filter)
    
    // Handle significance filter from URL (from trends navigation)  
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

  // Update draft filters when search query changes (but don't auto-apply)
  useEffect(() => {
    setDraftFilters(prev => ({ ...prev, search: searchQuery || undefined }));
  }, [searchQuery]);

  // Remove auto-debouncing for search - require manual Apply Filters
  // const timer is removed - search will only apply when user clicks Apply Filters

  // Initialize search from URL  
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, []);

  const { 
    moments, 
    userTimezone,
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
    // Validate date range
    if (draftFilters.dateRange?.from && draftFilters.dateRange?.to) {
      const from = startOfDay(draftFilters.dateRange.from);
      const to = startOfDay(draftFilters.dateRange.to);
      
      if (from > to) {
        toast.error('Start date must be before or equal to end date');
        return;
      }
    }

    // Process filters for application
    const processedFilters = { ...draftFilters };
    
    // Convert 'to' date to end-of-day for inclusive range
    if (processedFilters.dateRange?.to) {
      processedFilters.dateRange = {
        ...processedFilters.dateRange,
        to: endOfDay(processedFilters.dateRange.to)
      };
    }

    const params = new URLSearchParams();
    
    if (draftFilters.dateRange?.from) {
      params.set('from', format(draftFilters.dateRange.from, 'yyyy-MM-dd'));
    }
    if (draftFilters.dateRange?.to) {
      // Store the original date (not end of day) in URL for readability
      params.set('to', format(startOfDay(draftFilters.dateRange.to), 'yyyy-MM-dd'));
    }
    if (draftFilters.action) {
      params.set('action', draftFilters.action);
    }
    if (draftFilters.significance) params.set('significant', '1');
    if (draftFilters.search) params.set('q', draftFilters.search);
    if (draftFilters.categoryId && draftFilters.categoryId !== 'all') {
      params.set('categoryId', draftFilters.categoryId);
    }
    if (draftFilters.personId) params.set('personId', draftFilters.personId);
    
    setSearchParams(params, { replace: true });
    setAppliedFilters(processedFilters);
  }, [draftFilters, setSearchParams]);

  // Get current quick filter states
  const getCurrentDateRange = useCallback((): DateRangeLabel => {
    if (!appliedFilters.dateRange) return 'all';
    
    // Check if current range matches any of the predefined ranges
    for (const option of RANGE_OPTIONS) {
      if (option.label === 'all') continue;
      const range = getRangeLegacy(option.label);
      if (range && 
          appliedFilters.dateRange.from.getTime() === range.start.getTime() &&
          Math.abs(appliedFilters.dateRange.to.getTime() - range.end.getTime()) < 60000) { // Allow 1 minute tolerance
        return option.label;
      }
    }
    return 'all'; // Custom range, show as 'all'
  }, [appliedFilters.dateRange]);

  // Reset filters to what's currently applied (from URL)
  const handleResetFilters = useCallback(() => {
    setDraftFilters(appliedFilters);
    const q = searchParams.get('q');
    setSearchQuery(q || '');
  }, [appliedFilters, searchParams]);

  // Clear all filters except date range
  const handleClearFilters = useCallback(() => {
    const currentRange = getCurrentDateRange();
    const preservedDateRange = currentRange !== 'all' ? appliedFilters.dateRange : undefined;
    
    setDraftFilters(preservedDateRange ? { dateRange: preservedDateRange } : {});
    setSearchQuery('');
    
    const params = new URLSearchParams();
    if (preservedDateRange) {
      params.set('from', format(preservedDateRange.from, 'yyyy-MM-dd'));
      params.set('to', format(startOfDay(preservedDateRange.to), 'yyyy-MM-dd'));
    }
    
    setSearchParams(params, { replace: true });
    setAppliedFilters(preservedDateRange ? { dateRange: preservedDateRange } : {});
  }, [setSearchParams, getCurrentDateRange, appliedFilters.dateRange]);

  // Quick filter handlers for header chips
  const setQuickDateRange = useCallback((rangeLabel: DateRangeLabel) => {
    const range = getRangeLegacy(rangeLabel);
    const newFilters = { ...draftFilters };
    if (range) {
      newFilters.dateRange = { from: range.start, to: range.end };
    } else {
      delete newFilters.dateRange;
    }
    setDraftFilters(newFilters);
    
    // Auto-apply quick filters
    setTimeout(() => {
      const params = new URLSearchParams();
      if (range) {
        params.set('from', format(range.start, 'yyyy-MM-dd'));
        params.set('to', format(startOfDay(range.end), 'yyyy-MM-dd'));
      }
      if (newFilters.action) params.set('action', newFilters.action);
      if (newFilters.significance) params.set('significant', '1');
      if (newFilters.search) params.set('q', newFilters.search);
      if (newFilters.categoryId && newFilters.categoryId !== 'all') params.set('categoryId', newFilters.categoryId);
      if (newFilters.personId) params.set('personId', newFilters.personId);
      
      setSearchParams(params, { replace: true });
      setAppliedFilters({ ...newFilters, dateRange: range ? { from: range.start, to: range.end } : undefined });
    }, 0);
  }, [draftFilters, setSearchParams]);

  const setQuickAction = useCallback((action: 'given' | 'received' | undefined) => {
    const newFilters = { ...draftFilters, action };
    setDraftFilters(newFilters);
    
    // Auto-apply quick filters
    setTimeout(() => {
      const params = new URLSearchParams();
      if (newFilters.dateRange?.from) {
        params.set('from', format(newFilters.dateRange.from, 'yyyy-MM-dd'));
        params.set('to', format(startOfDay(newFilters.dateRange.to), 'yyyy-MM-dd'));
      }
      if (action) params.set('action', action);
      if (newFilters.significance) params.set('significant', '1');
      if (newFilters.search) params.set('q', newFilters.search);
      if (newFilters.categoryId && newFilters.categoryId !== 'all') params.set('categoryId', newFilters.categoryId);
      if (newFilters.personId) params.set('personId', newFilters.personId);
      
      setSearchParams(params, { replace: true });
      setAppliedFilters(newFilters);
    }, 0);
  }, [draftFilters, setSearchParams]);

  const setQuickSignificance = useCallback((significance: boolean) => {
    const newFilters = { ...draftFilters, significance: significance ? true : undefined };
    setDraftFilters(newFilters);
    
    // Auto-apply quick filters
    setTimeout(() => {
      const params = new URLSearchParams();
      if (newFilters.dateRange?.from) {
        params.set('from', format(newFilters.dateRange.from, 'yyyy-MM-dd'));
        params.set('to', format(startOfDay(newFilters.dateRange.to), 'yyyy-MM-dd'));
      }
      if (newFilters.action) params.set('action', newFilters.action);
      if (significance) params.set('significant', '1');
      if (newFilters.search) params.set('q', newFilters.search);
      if (newFilters.categoryId && newFilters.categoryId !== 'all') params.set('categoryId', newFilters.categoryId);
      if (newFilters.personId) params.set('personId', newFilters.personId);
      
      setSearchParams(params, { replace: true });
      setAppliedFilters(newFilters);
    }, 0);
  }, [draftFilters, setSearchParams]);

  const hasQuickFilters = appliedFilters.action || appliedFilters.significance;

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
    
    // Date range or "All time"
    if (appliedFilters.dateRange) {
      const { from, to } = appliedFilters.dateRange;
      if (format(from, 'yyyy-MM-dd') === format(startOfDay(to), 'yyyy-MM-dd')) {
        parts.push(format(from, 'MMM d'));
      } else {
        parts.push(`${format(from, 'MMM d')} - ${format(startOfDay(to), 'MMM d')}`);
      }
    } else {
      parts.push('All time');
    }
    
    // Action type (only if not "both"/default)
    if (appliedFilters.action) {
      parts.push(appliedFilters.action === 'given' ? 'Given' : 'Received');
    }
    
    // Category (only if not "all"/default)
    if (appliedFilters.categoryId && appliedFilters.categoryId !== 'all') {
      const category = categories.find(c => c.id === appliedFilters.categoryId);
      if (category) parts.push(`Category: ${category.name}`);
    }
    
    // Person (only if selected)
    if (appliedFilters.personId) {
      const person = people.find(p => p.id === appliedFilters.personId);
      if (person) parts.push(`Person: ${person.display_name}`);
    }
    
    // Significance (only if enabled)
    if (appliedFilters.significance) {
      parts.push('Significant');
    }
    
    // Search query (only if present)
    if (appliedFilters.search) {
      parts.push(`q: ${appliedFilters.search}`);
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
                  {formatRelativeDate(moment.happened_at, userTimezone)}
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

      {/* Header Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
        {/* Date Range Chips */}
        <div className="flex gap-1 flex-wrap">
          {RANGE_OPTIONS.map(option => (
            <Button
              key={option.label}
              variant={getCurrentDateRange() === option.label ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickDateRange(option.label)}
              className="text-xs px-2 h-7"
            >
              {option.display}
            </Button>
          ))}
        </div>
        
        {/* Action Chips */}
        <div className="flex gap-1">
          <Button
            variant={!appliedFilters.action ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickAction(undefined)}
            className="text-xs px-2 h-7"
          >
            Both
          </Button>
          <Button
            variant={appliedFilters.action === 'given' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickAction('given')}
            className="text-xs px-2 h-7"
          >
            Given
          </Button>
          <Button
            variant={appliedFilters.action === 'received' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickAction('received')}
            className="text-xs px-2 h-7"
          >
            Received
          </Button>
        </div>

        {/* Significance Toggle */}
        <Button
          variant={appliedFilters.significance ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickSignificance(!appliedFilters.significance)}
          className="text-xs px-2 h-7"
        >
          <Star className="h-3 w-3 mr-1" />
          Significant
        </Button>

        {/* Clear Quick Filters */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          disabled={!hasQuickFilters}
          className={cn(
            "text-xs px-2 h-7",
            hasQuickFilters 
              ? "text-muted-foreground hover:text-foreground" 
              : "text-muted-foreground/50 cursor-not-allowed"
          )}
        >
          Clear filters
        </Button>
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