import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { X, Calendar as CalendarIcon, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TimelineFilters } from '@/hooks/useTimeline'
import { usePeople } from '@/hooks/usePeople'
import { useCategories } from '@/hooks/useCategories'

interface TimelineFiltersProps {
  filters: TimelineFilters
  appliedFilters: TimelineFilters
  onFiltersChange: (filters: TimelineFilters) => void
  onApply: () => void
  onReset: () => void
  hasUnappliedChanges: boolean
  className?: string
}

export const TimelineFiltersComponent = ({ 
  filters, 
  appliedFilters,
  onFiltersChange, 
  onApply,
  onReset,
  hasUnappliedChanges,
  className 
}: TimelineFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  
  const { people } = usePeople()
  const { categories } = useCategories()

  const updateFilter = useCallback(<K extends keyof TimelineFilters>(key: K, value: TimelineFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }, [filters, onFiltersChange])

  const addTag = useCallback(() => {
    if (!tagInput.trim()) return
    const currentTags = filters.tags || []
    if (!currentTags.includes(tagInput.trim())) {
      updateFilter('tags', [...currentTags, tagInput.trim()])
    }
    setTagInput('')
  }, [tagInput, filters.tags, updateFilter])

  const removeTag = useCallback((tag: string) => {
    const currentTags = filters.tags || []
    updateFilter('tags', currentTags.filter(t => t !== tag))
  }, [filters.tags, updateFilter])

  const hasActiveFilters = Object.keys(appliedFilters).some(key => {
    if (key === 'search') return false // Search is handled separately
    const value = appliedFilters[key as keyof TimelineFilters]
    if (key === 'tags') return value && (value as string[]).length > 0
    if (key === 'dateRange') return value !== undefined
    return value !== undefined && value !== null && value !== ''
  })

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1"
            >
              {isOpen ? (
                <>
                  Hide Filters
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show Filters
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      format(filters.dateRange.from, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.from}
                    onSelect={(date) => 
                      updateFilter('dateRange', {
                        from: date || new Date(),
                        to: filters.dateRange?.to || new Date()
                      })
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.to ? (
                      format(filters.dateRange.to, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.to}
                    onSelect={(date) => 
                      updateFilter('dateRange', {
                        from: filters.dateRange?.from || new Date(),
                        to: date || new Date()
                      })
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Type */}
          <div>
            <Label>Action Type</Label>
            <ToggleGroup 
              type="single" 
              value={filters.action || 'both'} 
              onValueChange={(value) => updateFilter('action', value === 'both' ? undefined : value as 'given' | 'received')}
              className="justify-start"
            >
              <ToggleGroupItem value="both" variant="outline" size="sm">
                Both
              </ToggleGroupItem>
              <ToggleGroupItem value="given" variant="outline" size="sm">
                Given
              </ToggleGroupItem>
              <ToggleGroupItem value="received" variant="outline" size="sm">
                Received
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <div className="overflow-x-auto">
              <ToggleGroup 
                type="single" 
                value={filters.categoryId || 'all'} 
                onValueChange={(value) => updateFilter('categoryId', value === 'all' ? undefined : value)}
                className="justify-start flex-nowrap min-w-max"
              >
                <ToggleGroupItem value="all" variant="outline" size="sm">
                  All
                </ToggleGroupItem>
                {categories.map(category => (
                  <ToggleGroupItem key={category.id} value={category.id} variant="outline" size="sm">
                    {category.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {/* Person */}
          <div>
            <Label>Person</Label>
            <Select 
              value={filters.personId || 'all'} 
              onValueChange={(value) => updateFilter('personId', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All people" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                {people.filter(p => !p.merged_into).map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Significance */}
          <div className="flex items-center space-x-2">
            <Switch
              id="significance"
              checked={filters.significance === true}
              onCheckedChange={(checked) => updateFilter('significance', checked ? true : undefined)}
            />
            <Label htmlFor="significance">Show only significant moments</Label>
          </div>

          {/* Apply/Reset Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={onApply}
              disabled={!hasUnappliedChanges}
              className="flex-1"
            >
              Apply Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={onReset}
              disabled={!hasUnappliedChanges}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}