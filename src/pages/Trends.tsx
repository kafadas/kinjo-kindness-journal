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
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Calendar, Heart, Users, BarChart3, Plus, Filter, AlertCircle, ChevronDown, Info, ArrowUp, ArrowDown, Minus, Activity, Target, Zap, Globe } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { useTrends } from '@/hooks/useTrends'
import { useWeeklyPatterns } from '@/hooks/useWeeklyPatterns'
import { useMonthlyOverview } from '@/hooks/useMonthlyOverview'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { RANGE_OPTIONS, type DateRangeLabel } from '@/lib/dateRange'
import { formatPct1, formatNum, formatDelta } from '@/lib/formatters'
import { useTrendsUrlState } from '@/hooks/useTrendsUrlState'
import { computeBalance, formatPct, calculateDailyAverage, countActiveCategories, getBalanceMessage } from '@/lib/trendsUtils'

const ACTION_OPTIONS = [
  { label: 'Both', value: 'both' },
  { label: 'Given', value: 'given' },
  { label: 'Received', value: 'received' }
]

const chartConfig = {
  given: {
    label: 'Kindness Given',
    color: 'hsl(var(--chart-1))'
  },
  received: {
    label: 'Kindness Received', 
    color: 'hsl(var(--chart-2))'
  },
  total: {
    label: 'Total Moments',
    color: 'hsl(var(--chart-1))'
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
  const [searchParams] = useSearchParams()
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

  const hasActiveFilters = selectedRange !== 'all' || selectedAction !== 'both' || significanceOnly

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

  // Calculate summary data
  const totalMoments = data.seriesDaily.reduce((sum, day) => sum + day.total, 0)
  const givenMoments = data.seriesDaily.reduce((sum, day) => sum + day.given, 0)
  const receivedMoments = data.seriesDaily.reduce((sum, day) => sum + day.received, 0)
  const balance = computeBalance({ given: givenMoments, received: receivedMoments })
  const dailyAverage = calculateDailyAverage(data.seriesDaily)
  const activeCategories = countActiveCategories(data.categoryShare)

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

      {/* Filters Bar */}
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

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-semibold mb-1">{formatNum.format(totalMoments)}</div>
            <div className="text-sm text-muted-foreground">Total Moments</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center mx-auto mb-2">
              <ArrowUp className="h-5 w-5 text-chart-1" />
            </div>
            <div className="text-2xl font-semibold mb-1">{formatPct(balance.givenPct)}</div>
            <div className="text-sm text-muted-foreground">Given vs Received</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center mx-auto mb-2">
              <Activity className="h-5 w-5 text-chart-2" />
            </div>
            <div className="text-2xl font-semibold mb-1">
              {dailyAverage > 0 ? dailyAverage.toFixed(1) : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Daily Average</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center mx-auto mb-2">
              <Target className="h-5 w-5 text-chart-3" />
            </div>
            <div className="text-2xl font-semibold mb-1">{activeCategories}</div>
            <div className="text-sm text-muted-foreground">Active Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Kindness Balance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Kindness Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-chart-1">Kindness Given</span>
                <span className="font-medium">{givenMoments} ({formatPct(balance.givenPct)})</span>
              </div>
              <Progress value={balance.givenPct} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-chart-2">Kindness Received</span>
                <span className="font-medium">{receivedMoments} ({formatPct(balance.receivedPct)})</span>
              </div>
              <Progress value={balance.receivedPct} className="h-2" />
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center pt-2 border-t">
            {getBalanceMessage(balance.givenPct, balance.receivedPct)}
          </p>
        </CardContent>
      </Card>

      {/* Moments Over Time */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Moments Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart 
                data={data.seriesDaily}
                onClick={(data) => {
                  if (data?.activeLabel) {
                    const dateParam = format(parseISO(data.activeLabel), 'yyyy-MM-dd')
                    const params = new URLSearchParams(searchParams)
                    params.set('date', dateParam)
                    params.set('range', 'day')
                    navigate(`/timeline?${params.toString()}`)
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                  fontSize={12}
                  tickMargin={8}
                />
                <YAxis fontSize={12} tickMargin={8} />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null
                    
                    const date = format(parseISO(label), 'MMM d')
                    const given = payload.find(p => p.dataKey === 'given')?.value || 0
                    const received = payload.find(p => p.dataKey === 'received')?.value || 0
                    const total = Number(given) + Number(received)
                    
                    return (
                      <div className="bg-background border border-border rounded-lg shadow-md p-3">
                        <p className="font-medium mb-2">{date}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-chart-1"></div>
                            <span>Given: {given}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-chart-2"></div>
                            <span>Received: {received}</span>
                          </div>
                          <div className="pt-1 border-t">
                            <span>Total: {total}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend 
                  content={({ payload }) => (
                    <div className="flex justify-center gap-6 mt-4">
                      {payload?.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <span className="text-sm text-muted-foreground">
                            {entry.value === 'given' ? 'Kindness Given' : 'Kindness Received'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="given"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--chart-1))', strokeWidth: 2 }}
                  name="given"
                />
                <Line
                  type="monotone"
                  dataKey="received"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                  name="received"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Charts respect the filters above (Action, Significant). Click any point to view moments from that day.
          </p>
        </CardContent>
      </Card>

      {/* Weekly Patterns & Category Breakdown / Monthly Overview */}
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

        {/* Category Breakdown & Monthly Overview */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryShare.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No category data available
                </div>
              ) : (
                <div className="space-y-2">
                  {data.categoryShare.slice(0, 5).map((category, index) => (
                    <div 
                      key={category.category_id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleCategoryClick(category.category_id)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(category.category_id, index) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{category.name}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((category.pct / 100) * totalMoments)} ({category.pct.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
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
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
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
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold mb-1">{current}</div>
                          <div className="text-xs text-muted-foreground">This Month</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold mb-1">{previous}</div>
                          <div className="text-xs text-muted-foreground">Last Month</div>
                        </div>
                      </div>
                      
                      <div className="text-center border-t pt-2">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {roundedGrowth > 0 ? (
                            <ArrowUp className="h-3 w-3 text-success" />
                          ) : roundedGrowth < 0 ? (
                            <ArrowDown className="h-3 w-3 text-destructive" />
                          ) : (
                            <Minus className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={cn(
                            "text-xs font-medium",
                            roundedGrowth > 0 ? "text-success" :
                            roundedGrowth < 0 ? "text-destructive" :
                            "text-muted-foreground"
                          )}>
                            {roundedGrowth !== 0 && (roundedGrowth > 0 ? '+' : '')}{roundedGrowth}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {message}
                        </p>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No monthly data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}