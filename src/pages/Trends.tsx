import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingCard } from '@/components/ui/loading-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { TrendingUp, Calendar, Heart, Users, BarChart3, Plus, Filter, RefreshCw, AlertCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { useTrends } from '@/hooks/useTrends'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { RANGE_OPTIONS, type DateRangeLabel } from '@/lib/dateRange'
import { formatPct1, formatNum, formatDelta } from '@/lib/formatters'

const ACTION_OPTIONS = [
  { label: 'Both', value: 'both' },
  { label: 'Given', value: 'given' },
  { label: 'Received', value: 'received' }
]

const chartConfig = {
  given: {
    label: 'Kindness Given',
    color: 'hsl(var(--primary))'
  },
  received: {
    label: 'Kindness Received', 
    color: 'hsl(var(--secondary))'
  },
  total: {
    label: 'Total Moments',
    color: 'hsl(var(--primary))'
  }
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))', 
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
  '#ef4444', // red-500
  '#3b82f6', // blue-500  
  '#10b981', // green-500
  '#8b5cf6', // purple-500
  '#f59e0b', // yellow-500
  '#06b6d4'  // cyan-500
]

export const Trends: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedRange, setSelectedRange] = useState<DateRangeLabel>('90d')
  const [selectedAction, setSelectedAction] = useState<'given' | 'received' | 'both'>('both')
  const [significanceOnly, setSignificanceOnly] = useState(false)

  const { data, isLoading, isError, error, refetch } = useTrends({
    range: selectedRange,
    action: selectedAction,
    significance: significanceOnly
  })

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['trends', user?.id] })
    refetch()
  }

  const handleClearFilters = () => {
    setSelectedAction('both')
    setSignificanceOnly(false)
    // Trigger refetch after state updates
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['trends', user?.id] })
      refetch()
    }, 0)
  }

  const hasActiveFilters = selectedAction !== 'both' || significanceOnly

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams({
      range: selectedRange,
      action: selectedAction,
      significant: significanceOnly.toString()
    })
    navigate(`/categories/${categoryId}?${params.toString()}`)
  }

  const handleTimelineClick = (date: string) => {
    const params = new URLSearchParams({
      start: date,
      end: date,
      action: selectedAction,
      significant: significanceOnly.toString()
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
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
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
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh Data
          </Button>
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
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
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
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
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
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    )
  }

  const totalMoments = data.seriesDaily.reduce((sum, day) => sum + day.total, 0)
  const givenMoments = data.seriesDaily.reduce((sum, day) => sum + day.given, 0)
  const receivedMoments = data.seriesDaily.reduce((sum, day) => sum + day.received, 0)
  const givenPercentage = totalMoments > 0 ? Math.round((givenMoments / totalMoments) * 100) : 0

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
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="ml-auto"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map(option => (
            <Button
              key={option.label}
              variant={selectedRange === option.label ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(option.label)}
            >
              {option.display}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          {ACTION_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={selectedAction === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAction(option.value as any)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Button
          variant={significanceOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSignificanceOnly(!significanceOnly)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Significant Only
        </Button>

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="text-muted-foreground/50 cursor-not-allowed"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Key Insights */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">{totalMoments}</div>
            <div className="text-sm text-muted-foreground">Total Moments</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">{formatPct1(givenPercentage / 100)}</div>
            <div className="text-sm text-muted-foreground">Given vs Received</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">
              {(() => {
                const days = selectedRange === '1y' ? 365 : parseInt(selectedRange.replace('d', ''))
                return totalMoments > 0 ? (totalMoments / days).toFixed(1) : '0'
              })()}
            </div>
            <div className="text-sm text-muted-foreground">Daily Average</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">{data.categoryShare.length}</div>
            <div className="text-sm text-muted-foreground">Active Categories</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Moments over time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Moments over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart 
                data={data.seriesDaily}
                onClick={(event) => {
                  if (event?.activeLabel) {
                    handleTimelineClick(event.activeLabel)
                  }
                }}
              >
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                />
                <YAxis />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      if (data) {
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">{format(parseISO(label as string), 'MMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              Total {data.total} (Given {data.given}, Received {data.received})
                            </p>
                          </div>
                        );
                      }
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="given"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  stackId="1"
                  stroke="hsl(var(--secondary))"
                  fill="hsl(var(--secondary))"
                  fillOpacity={0.6}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Charts respect the filters above (Action, Significant). Click any point to view moments from that day.
            </p>
          </CardContent>
        </Card>

        {/* Category Share */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Share of moments in selected range</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.categoryShare.slice(0, 8).map((category, index) => (
                <div 
                  key={category.category_id} 
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                  onClick={() => handleCategoryClick(category.category_id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {category.name} — {formatPct1(category.pct / 100)}
                      {category.delta_pct !== 0 && (
                        <span 
                          className={cn(
                            "text-xs",
                            category.delta_pct > 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          ({formatDelta(category.delta_pct / 100)} vs prev window)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Median Days Between Moments */}
        <Card>
          <CardHeader>
            <CardTitle>Time Between Moments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.medianGaps.length > 0 ? (
              <div className="space-y-3">
                {data.medianGaps.slice(0, 6).map((gap, index) => (
                  <div key={gap.category_id} className="flex items-center gap-3">
                    <div className="flex-1 text-sm font-medium">{gap.name}</div>
                    <Badge variant="outline" className="text-xs">
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
    </div>
  )
}