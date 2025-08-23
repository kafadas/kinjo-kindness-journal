import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingCard } from '@/components/ui/loading-card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { TrendingUp, Calendar, Heart, Users, BarChart3, Plus, Filter } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { useTrends } from '@/hooks/useTrends'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const RANGE_OPTIONS = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '180d', value: 180 },
  { label: '365d', value: 365 }
]

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
  const [selectedRange, setSelectedRange] = useState(90)
  const [selectedAction, setSelectedAction] = useState<'given' | 'received' | 'both'>('both')
  const [significanceOnly, setSignificanceOnly] = useState(false)

  const { data, isLoading, error } = useTrends({
    range: selectedRange,
    action: selectedAction,
    significance: significanceOnly
  })

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/categories/${categoryId}`)
  }

  const handleTimelineClick = (date: string) => {
    navigate(`/timeline?date=${date}`)
  }
  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <EmptyState
          icon={TrendingUp}
          title="Unable to load trends"
          description="There was an error loading your trends data. Please try again."
          action={{
            label: "Retry",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold mb-2">
            Insights & Trends
          </h1>
          <p className="text-muted-foreground">
            Discover gentle patterns in your kindness journey
          </p>
        </div>
        <div className="grid gap-6">
          <LoadingCard />
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
          <h1 className="font-display text-2xl font-semibold mb-2">
            Insights & Trends
          </h1>
          <p className="text-muted-foreground">
            Discover gentle patterns in your kindness journey
          </p>
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
        <h1 className="font-display text-2xl font-semibold mb-2">
          Insights & Trends
        </h1>
        <p className="text-muted-foreground">
          Discover gentle patterns in your kindness journey
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex gap-2">
          {RANGE_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={selectedRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(option.value)}
            >
              {option.label}
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
            <div className="text-lg font-semibold mb-1">{givenPercentage}%</div>
            <div className="text-sm text-muted-foreground">Given vs Received</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-lg font-semibold mb-1">
              {totalMoments > 0 ? (totalMoments / selectedRange).toFixed(1) : '0'}
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
              <AreaChart data={data.seriesDaily}>
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => format(parseISO(value as string), 'MMM d, yyyy')}
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
          </CardContent>
        </Card>

        {/* Category Share */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
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
                  <div className="flex-1 text-sm font-medium">{category.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {category.pct}%
                  </Badge>
                  {category.delta_pct !== 0 && (
                    <Badge 
                      variant={category.delta_pct > 0 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {category.delta_pct > 0 ? '▲' : '▼'} {Math.abs(category.delta_pct)}%
                    </Badge>
                  )}
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
                      {gap.median_days} {gap.median_days === 1 ? 'day' : 'days'}
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