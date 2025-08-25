import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingCard } from '@/components/ui/loading-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, Calendar, Heart, Users, BarChart3, Plus, Filter, AlertCircle, ChevronDown, Info, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { useTrends } from '@/hooks/useTrends'
import { useWeeklyPatterns } from '@/hooks/useWeeklyPatterns'
import { useMonthlyOverview } from '@/hooks/useMonthlyOverview'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { RANGE_OPTIONS, type DateRangeLabel } from '@/lib/dateRange'
import { formatPct1, formatNum, formatDelta } from '@/lib/formatters'
import { useTrendsUrlState } from '@/hooks/useTrendsUrlState'

const ACTION_OPTIONS = [
  { label: 'Both', value: 'both' },
  { label: 'Given', value: 'given' },
  { label: 'Received', value: 'received' }
]

  const chartConfig = {
    given: {
      label: 'Kindness Given',
      color: '#4f46e5' // indigo-600
    },
    received: {
      label: 'Kindness Received', 
      color: 'hsl(142 76% 36%)' // success green
    },
    total: {
      label: 'Total Moments',
      color: '#4f46e5' // indigo-600
    }
  }

const CHART_COLORS = [
  '#6366f1', // indigo-500 - primary brand color
  '#10b981', // emerald-500 - success green
  '#f59e0b', // amber-500 - warm yellow
  '#ef4444', // red-500 - red accent
  '#8b5cf6', // violet-500 - purple accent
  '#06b6d4', // cyan-500 - cool blue
  '#ec4899', // pink-500 - pink accent
  '#84cc16', // lime-500 - bright green
  '#f97316', // orange-500 - vibrant orange
  '#6b7280', // gray-500 - neutral
  '#3b82f6', // blue-500 - classic blue
  '#14b8a6', // teal-500 - teal accent
  '#a855f7', // purple-600 - deeper purple
  '#dc2626', // red-600 - deeper red
  '#059669', // emerald-600 - deeper green
  '#7c3aed', // violet-600 - deeper violet
  '#db2777', // pink-600 - deeper pink
  '#ca8a04', // yellow-600 - deeper yellow
  '#ea580c', // orange-600 - deeper orange
  '#4f46e5'  // indigo-600 - deeper indigo
]

// Function to get a consistent color for a category
const getCategoryColor = (categoryId: string, index: number): string => {
  // Use a simple hash of the category ID to ensure consistent colors
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    const char = categoryId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to pick a color, with fallback to index
  const colorIndex = Math.abs(hash) % CHART_COLORS.length;
  return CHART_COLORS[colorIndex] || CHART_COLORS[index % CHART_COLORS.length];
}

export const Trends: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { urlState, setUrlState, clearFilters } = useTrendsUrlState()
  const { range: selectedRange, action: selectedAction, significant: significanceOnly } = urlState

  const { data, isLoading, isError, error, refetch } = useTrends({
    range: selectedRange,
    action: selectedAction,
    significance: significanceOnly
  })

  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyPatterns({
    range: selectedRange,
    action: selectedAction,
    significance: significanceOnly
  })

  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyOverview({
    action: selectedAction,
    significance: significanceOnly
  })


  const handleClearFilters = () => {
    clearFilters()
  }

  const hasActiveFilters = selectedAction !== 'both' || significanceOnly

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams()
    if (selectedRange !== 'all') params.set('range', selectedRange)
    if (selectedAction !== 'both') params.set('action', selectedAction)
    if (significanceOnly) params.set('significant', '1')
    navigate(`/categories/${categoryId}?${params.toString()}`)
  }

  const handleTimelineClick = (date: string) => {
    const params = new URLSearchParams({
      date: date,
      range: 'day',
      action: selectedAction,
      significant: significanceOnly ? '1' : '0'
    })
    navigate(`/timeline?${params.toString()}`)
  }
  if (isError) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold mb-2">
                Insights & Trends
              </h1>
              <p className="text-muted-foreground">
                Discover gentle patterns in your kindness journey
              </p>
            </div>
          </div>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load trends data. {error?.message || 'Please try again.'}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-2 text-xs opacity-70">
                <summary className="cursor-pointer">Debug info</summary>
                <pre className="mt-1 whitespace-pre-wrap break-all">
                  {error.toString()}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/capture')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Moment
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold mb-2">
                Insights & Trends
              </h1>
              <p className="text-muted-foreground">
                Discover gentle patterns in your kindness journey
              </p>
            </div>
          </div>
        </div>

        {/* Loading Controls */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex gap-2">
            {RANGE_OPTIONS.map(option => (
              <Skeleton key={option.label} className="h-8 w-12" />
            ))}
          </div>
          <div className="flex gap-2">
            {ACTION_OPTIONS.map((option, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </div>
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Loading Key Insights */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <Skeleton className="w-10 h-10 rounded-lg mx-auto mb-2" />
                <Skeleton className="h-5 w-12 mx-auto mb-1" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px]" />
            </CardContent>
          </Card>
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    )
  }

  const hasData = data && (
    data.seriesDaily.some(d => d.total > 0) ||
    data.categoryShare.length > 0 ||
    data.medianGaps.length > 0
  )

  if (!hasData) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold mb-2">
                Insights & Trends
              </h1>
              <p className="text-muted-foreground">
                Discover gentle patterns in your kindness journey
              </p>
            </div>
          </div>
        </div>
        <EmptyState
          icon={Heart}
          title="No trends yet"
          description="Start capturing moments of kindness to see your patterns over time."
          action={{
            label: "Add Moment",
            onClick: () => navigate('/capture')
          }}
        />
        
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate('/capture')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Moment
          </Button>
        </div>
      </div>
    )
  }

  const totalMoments = data.seriesDaily.reduce((sum, day) => sum + day.total, 0)
  const givenMoments = data.seriesDaily.reduce((sum, day) => sum + day.given, 0)
  const givenPercentage = totalMoments > 0 ? (givenMoments / totalMoments) : 0

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold mb-2">
                Insights & Trends
              </h1>
              <p className="text-muted-foreground">
                Discover gentle patterns in your kindness journey
              </p>
            </div>
          </div>
        </div>

      {/* Controls - Row 1 */}
      <div className="flex flex-wrap gap-2 mb-6 p-3 sm:p-4 bg-muted/30 rounded-lg overflow-hidden">
        {/* Range Pills */}
        <div className="flex gap-1 sm:gap-2 flex-wrap min-w-0">
          {RANGE_OPTIONS.map(option => (
            <Button
              key={option.label}
              variant={selectedRange === option.label ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUrlState({ range: option.label })}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              {option.display}
            </Button>
          ))}
        </div>
        
        {/* Action Filter Chips */}
        <div className="flex gap-1 sm:gap-2 flex-wrap min-w-0">
          {ACTION_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={selectedAction === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUrlState({ action: option.value as any })}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Significance Filter */}
        <Button
          variant={significanceOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUrlState({ significant: !significanceOnly })}
          className="text-xs sm:text-sm px-2 sm:px-3 min-w-0"
        >
          <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Significant Only</span>
          <span className="sm:hidden">Significant</span>
        </Button>

        {/* Clear Filters */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          className={cn(
            "text-xs sm:text-sm px-2 sm:px-3",
            hasActiveFilters 
              ? "text-muted-foreground hover:text-foreground" 
              : "text-muted-foreground/50 cursor-not-allowed"
          )}
        >
          Clear filters
        </Button>
      </div>

      {/* Weekly Patterns & Monthly Overview - Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : weeklyData && weeklyData.length > 0 ? (
              (() => {
                const maxCount = Math.max(...weeklyData.map(d => d.count))
                // Reorder to start with Monday (weekday 1)
                const orderedData = [1, 2, 3, 4, 5, 6, 0].map(dow => 
                  weeklyData.find(d => d.weekday === dow)
                ).filter(Boolean)
                
                return (
                  <div className="space-y-3">
                    {orderedData.map((day) => (
                      <div key={day.weekday} className="flex items-center gap-3">
                        <div className="w-12 text-sm text-muted-foreground">
                          {day.weekday_name.slice(0, 3)}
                        </div>
                        <div className="flex-1 relative">
                          <div 
                            className="h-6 bg-primary/20 rounded-full relative"
                            style={{ 
                              width: maxCount > 0 ? `${(day.count / maxCount) * 100}%` : '0%',
                              minWidth: day.count > 0 ? '8px' : '0px'
                            }}
                          >
                            <div className="absolute inset-0 bg-primary rounded-full opacity-60" />
                          </div>
                        </div>
                        <div className="w-8 text-sm font-medium text-right">
                          {day.count}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No weekly pattern data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            ) : monthlyData ? (
              (() => {
                const current = monthlyData.current_month_count
                const previous = monthlyData.previous_month_count
                const growthPct = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0)
                const roundedGrowth = Math.round(growthPct)
                
                let message = "Consistent flow — small steps add up."
                if (roundedGrowth >= 10) {
                  message = "You're trending up — keep the momentum 💜"
                } else if (roundedGrowth <= -10) {
                  message = "A gentle nudge — try one small act this week."
                }
                
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold mb-1">{current}</div>
                        <div className="text-sm text-muted-foreground">This Month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold mb-1">{previous}</div>
                        <div className="text-sm text-muted-foreground">Last Month</div>
                      </div>
                    </div>
                    
                    <div className="text-center border-t pt-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {Math.abs(roundedGrowth) < 3 ? (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        ) : roundedGrowth > 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={cn(
                          "font-medium",
                          Math.abs(roundedGrowth) < 3 ? "text-muted-foreground" :
                          roundedGrowth > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {roundedGrowth > 0 ? '+' : ''}{roundedGrowth}%
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {message}
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No monthly comparison data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="text-base sm:text-lg font-semibold mb-1">{formatNum.format(totalMoments)}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Moments</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="text-base sm:text-lg font-semibold mb-1">{formatPct1(givenPercentage)}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Given vs Received</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="text-base sm:text-lg font-semibold mb-1">
              {(() => {
                if (selectedRange === 'all') {
                  // For "All" filter, calculate actual daily average based on data span
                  if (totalMoments === 0) return '0'
                  
                  // Get the span of days from the data
                  const dates = data.seriesDaily.map(d => d.date).filter(Boolean)
                  if (dates.length === 0) return '0'
                  
                  const firstDate = new Date(dates[0])
                  const lastDate = new Date(dates[dates.length - 1])
                  const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                  
                  return (totalMoments / daysDiff).toFixed(1)
                }
                const days = selectedRange === '365d' ? 365 : parseInt(selectedRange.replace('d', ''))
                return totalMoments > 0 ? (totalMoments / days).toFixed(1) : '0'
              })()}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Daily Average</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="text-base sm:text-lg font-semibold mb-1">{data.categoryShare.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Active Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Section: Moments over time */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Moments over time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
            <AreaChart 
              data={data.seriesDaily}
              onClick={(event) => {
                if (event?.activeLabel) {
                  handleTimelineClick(event.activeLabel)
                }
              }}
            >
              <defs>
                <linearGradient id="givenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                fontSize={12}
              />
              <YAxis 
                fontSize={12} 
                domain={[0, (dataMax: number) => Math.max(dataMax + 1, 1)]}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0]?.payload;
                    if (data) {
                      const dateStr = format(parseISO(label as string), 'MMM d')
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium mb-2">{dateStr}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                              <span>Given: {data.given}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-success"></div>
                              <span>Received: {data.received}</span>
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t">
                              <span className="font-medium">Total: {data.total}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />
              {/* Always show both areas when action is 'both' or individual areas for specific actions */}
              {(selectedAction === 'both' || selectedAction === 'given') && (
                <Area
                  type="monotone"
                  dataKey="given"
                  stackId="1"
                  stroke="#4f46e5"
                  fill="url(#givenGradient)"
                  strokeWidth={2}
                />
              )}
              {(selectedAction === 'both' || selectedAction === 'received') && (
                <Area
                  type="monotone"
                  dataKey="received"
                  stackId="1"
                  stroke="hsl(142 76% 36%)"
                  fill="url(#receivedGradient)"
                  strokeWidth={2}
                />
              )}
              <ChartLegend 
                content={({ payload }) => {
                  if (!payload) return null;
                  
                  const visibleLegendItems = payload.filter(item => {
                    if (selectedAction === 'both') return true;
                    if (selectedAction === 'given') return item.dataKey === 'given';
                    if (selectedAction === 'received') return item.dataKey === 'received';
                    return false;
                  });

                  return (
                    <div className="flex justify-center gap-6 mt-4 text-sm">
                      {visibleLegendItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: item.dataKey === 'given' ? '#4f46e5' : 'hsl(142 76% 36%)'
                            }}
                          />
                          <span className="text-muted-foreground">
                            {item.dataKey === 'given' ? 'Kindness Given' : 'Kindness Received'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </AreaChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Charts respect the filters above (Action, Significant). Click any point to view moments from that day.
          </p>
        </CardContent>
      </Card>

      {/* Section: Category Breakdown + Time Between */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Category Breakdown
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground">
                      <Info className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Share is calculated within the selected time range and filters.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Share of moments in selected range</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.categoryShare.slice(0, 8).map((category, index) => {
                // Calculate absolute count from percentage and total moments
                const absoluteCount = Math.round((category.pct / 100) * totalMoments)
                return (
                  <div 
                    key={category.category_id} 
                    className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                    onClick={() => handleCategoryClick(category.category_id)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(category.category_id, index) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="truncate">{category.name} — {absoluteCount} ({formatPct1(category.pct / 100)})</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Between Moments */}
        <Card>
          <CardHeader>
            <CardTitle>Time Between Moments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.medianGaps.length > 0 ? (
              <div className="space-y-3">
                {data.medianGaps.slice(0, 6).map((gap, index) => (
                  <div key={gap.category_id} className="flex items-center gap-3">
                    <div className="flex-1 text-sm font-medium truncate">{gap.name}</div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {formatNum.format(gap.median_days)} {gap.median_days === 1 ? 'day' : 'days'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Not enough data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optional Secondary Section - Collapsible */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full mb-4">
            <ChevronDown className="h-4 w-4 mr-2" />
            Additional Insights
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Patterns & Monthly Overview</CardTitle>
              <p className="text-xs text-muted-foreground">
                Coming soon - Weekly distribution and monthly summaries
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Weekly patterns and monthly overview will be available here</p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}