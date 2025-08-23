import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Heart, Calendar, Filter, TrendingUp, Users, Plus, Search, MoreHorizontal, Edit, Tag } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { DiscreetText } from '@/components/ui/DiscreetText';
import { useCategoryDetails } from '@/hooks/useCategories';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingGrid, LoadingCard } from '@/components/ui/loading-card';
import { CaptureModal } from '@/components/modals/CaptureModal';
import { formatDistanceToNow, startOfMonth, endOfMonth, subDays, format, isToday, isYesterday } from 'date-fns';

export const CategoryDetails: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { isDiscreetMode } = useDiscreetMode()
  
  // Initialize filters from URL parameters
  const getInitialState = () => {
    const range = searchParams.get('range')
    const action = searchParams.get('action')
    const significant = searchParams.get('significant')
    
    return {
      searchQuery: '',
      selectedFilter: (action && action !== 'both' ? action : 'all') as 'all' | 'given' | 'received',
      // Note: range and significant filters would need to be implemented in the category details hook
    }
  }
  
  const initialState = getInitialState()
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery)
  const [selectedFilter, setSelectedFilter] = useState(initialState.selectedFilter)
  const [captureModalOpen, setCaptureModalOpen] = useState(false)

  const { category, moments, stats, isLoading } = useCategoryDetails(id!)

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <LoadingCard className="mb-6" />
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={Tag}
          title="Category not found"
          description="The category you're looking for doesn't exist or has been deleted."
          action={{
            label: "Back to Categories",
            onClick: () => navigate('/categories')
          }}
        />
      </div>
    )
  }

  // Filter moments based on search and action filter
  const filteredMoments = moments.filter(moment => {
    const matchesSearch = !searchQuery || 
      moment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      moment.person?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || moment.action === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  // Group moments by date
  const groupedMoments = filteredMoments.reduce((groups, moment) => {
    const date = new Date(moment.happened_at).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(moment)
    return groups
  }, {} as Record<string, typeof moments>)

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  // Get top people from stats
  const topPeople = moments.reduce((acc, moment) => {
    if (!moment.person) return acc
    const personId = moment.person.id
    acc[personId] = (acc[personId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedPeople = Object.entries(topPeople)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([personId, count]) => {
      const person = moments.find(m => m.person?.id === personId)?.person
      return { person, count }
    })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/categories')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">
            <DiscreetText text={category.name} variant="name" />
          </h1>
          <p className="text-muted-foreground">
            Category details and timeline
          </p>
        </div>
        <Button onClick={() => setCaptureModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Moment
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit Category
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Tag className="h-4 w-4 mr-2" />
              Bulk Reassign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats?.total || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats?.given || 0}
            </div>
            <div className="text-sm text-muted-foreground">Kindness Given</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats?.received || 0}
            </div>
            <div className="text-sm text-muted-foreground">Kindness Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats?.uniquePeople || 0}
            </div>
            <div className="text-sm text-muted-foreground">People Connected</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Timeline
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search moments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as 'all' | 'given' | 'received')}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="given">Given</TabsTrigger>
                      <TabsTrigger value="received">Received</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedMoments).length > 0 ? (
                Object.entries(groupedMoments)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([date, dateMoments]) => (
                    <div key={date}>
                      <h3 className="font-medium text-sm text-muted-foreground mb-3 sticky top-0 bg-background/95 backdrop-blur py-1">
                        {formatDateHeader(date)}
                      </h3>
                      <div className="space-y-3">
                        {dateMoments.map((moment) => (
                          <div key={moment.id} className="border-l-2 border-primary/20 pl-4 py-2 hover:bg-muted/50 rounded-r">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={moment.action === 'given' ? 'default' : 'secondary'} className="text-xs">
                                {moment.action === 'given' ? 'Given' : 'Received'}
                              </Badge>
                              {moment.person && (
                                <span className="text-xs font-medium">
                                  <DiscreetText text={moment.person.display_name} variant="name" />
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {format(new Date(moment.happened_at), 'h:mm a')}
                              </span>
                            </div>
                            {moment.description && (
                              <p className="text-sm">
                                <DiscreetText text={moment.description} variant="body" className="text-sm" />
                              </p>
                            )}
                            {moment.tags && moment.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {moment.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                <EmptyState
                  icon={searchQuery ? Search : Heart}
                  title={searchQuery ? "No moments found" : "No moments yet"}
                  description={
                    searchQuery 
                      ? `No moments match "${searchQuery}". Try a different search term.`
                      : "Start adding moments to this category to see your timeline."
                  }
                  action={!searchQuery ? {
                    label: "Add First Moment",
                    onClick: () => setCaptureModalOpen(true)
                  } : undefined}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top People */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Most Connected
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedPeople.length > 0 ? (
                <div className="space-y-2">
                  {sortedPeople.map(({ person, count }, index) => (
                    person && (
                      <div key={person.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="font-medium">
                          <DiscreetText text={person.display_name} variant="name" className="font-medium" />
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {count} moments
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No people connected yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Balance</span>
                  <span className="text-sm font-medium">
                    {stats?.given && stats?.received 
                      ? `${Math.round((stats.given / (stats.given + stats.received)) * 100)}% given`
                      : 'No data'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Recent activity</span>
                  <span className="text-sm font-medium">
                    {moments.filter(m => 
                      new Date(m.happened_at) >= subDays(new Date(), 7)
                    ).length} this week
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average per week</span>
                  <span className="text-sm font-medium">
                    {Math.round((stats?.total || 0) / Math.max(1, 
                      Math.ceil((Date.now() - new Date(category.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000))
                    ))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Capture Modal */}
      <CaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        seedCategory={id}
      />
    </div>
  )
}