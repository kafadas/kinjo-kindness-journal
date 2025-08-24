import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate, useLocation } from 'react-router-dom'
import { RefreshCw, ExternalLink, Database, User, Calendar, BarChart3, AlertCircle, CheckCircle, Filter, Activity } from 'lucide-react'
import { RANGE_OPTIONS, type DateRangeLabel, getRange } from '@/lib/dateRange'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatPct1, formatNum, formatDelta } from '@/lib/formatters'

const ACTION_OPTIONS = [
  { label: 'Both', value: 'both' },
  { label: 'Given', value: 'given' },
  { label: 'Received', value: 'received' }
]

export const DevTrendsCheck: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRangeLabel>('90d')
  const [selectedAction, setSelectedAction] = useState<'given' | 'received' | 'both'>('both')
  const [significanceOnly, setSignificanceOnly] = useState(false)

  // Check if we should show this dev page
  const isDev = location.pathname === '/dev/trends-check' || 
               new URLSearchParams(location.search).get('dev') === '1'
  
  if (!isDev) {
    return null
  }

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('user_id', user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Moment counts for different ranges with current filters
  const { data: momentCounts, isLoading: countsLoading, error: countsError } = useQuery({
    queryKey: ['dev-moment-counts', user?.id, selectedRange, selectedAction, significanceOnly],
    queryFn: async () => {
      if (!user?.id) return null
      
      const ranges: DateRangeLabel[] = ['all', '30d', '90d', '120d', '1y']
      const results = await Promise.all(
        ranges.map(async (rangeLabel) => {
          const dateRange = getRange(rangeLabel)
          
          let query = supabase
            .from('moments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
          
          // Apply date filter only if not "all"
          if (dateRange) {
            query = query
              .gte('happened_at', dateRange.start.toISOString())
              .lte('happened_at', dateRange.end.toISOString())
          }
          
          // Apply action filter
          if (selectedAction !== 'both') {
            query = query.eq('action', selectedAction)
          }
          
          // Apply significance filter
          if (significanceOnly) {
            query = query.eq('significance', true)
          }
          
          const { count, error } = await query
          
          return { range: rangeLabel, count, error }
        })
      )
      
      return results
    },
    enabled: !!user?.id
  })

  // Test RPC functions with current filters
  const { data: rpcResults, isLoading: rpcLoading, error: rpcError } = useQuery({
    queryKey: ['dev-rpc-test', user?.id, selectedRange, selectedAction, significanceOnly],
    queryFn: async () => {
      if (!user?.id) return null
      
      const dateRange = getRange(selectedRange)
      const startStr = dateRange ? format(dateRange.start, 'yyyy-MM-dd') : null
      const endStr = dateRange ? format(dateRange.end, 'yyyy-MM-dd') : null

      const tz = profile?.timezone ?? 'UTC'

      try {
        const [dailyResult, categoryResult, medianResult] = await Promise.all([
          supabase.rpc('daily_moment_counts_v1', {
            p_user: user.id,
            p_start: startStr,
            p_end: endStr,
            p_action: selectedAction,
            p_significant_only: significanceOnly,
            p_tz: tz
          }),
          supabase.rpc('category_share_delta_v1', {
            p_user: user.id,
            p_start: startStr,
            p_end: endStr,
            p_action: selectedAction,
            p_significant_only: significanceOnly,
            p_tz: tz
          }),
          supabase.rpc('median_gap_by_category', {
            p_user: user.id,
            p_start: startStr,
            p_end: endStr,
            p_action: selectedAction,
            p_significant_only: significanceOnly
          })
        ])

        return {
          daily: { 
            data: dailyResult.data, // Get all data for debug row
            error: dailyResult.error 
          },
          category: { 
            data: categoryResult.data?.slice(0, 5)?.map(row => ({
              ...row,
              pct: row.pct ? parseFloat(row.pct.toString()) : row.pct
            })),
            error: categoryResult.error 
          },
          median: { 
            data: medianResult.data?.slice(0, 5)?.map(row => ({
              ...row,
              median_days: row.median_days ? parseFloat(row.median_days.toString()) : row.median_days
            })), 
            error: medianResult.error 
          }
        }
      } catch (error) {
        throw error
      }
    },
    enabled: !!user?.id
  })

  // Chart Parity Check - Compare trends data vs timeline data
  const { data: parityResults, isLoading: parityLoading, error: parityError } = useQuery({
    queryKey: ['dev-parity-check', user?.id, selectedRange, selectedAction, significanceOnly],
    queryFn: async () => {
      if (!user?.id) return null
      
      const dateRange = getRange(selectedRange)
      const startStr = dateRange ? format(dateRange.start, 'yyyy-MM-dd') : null
      const endStr = dateRange ? format(dateRange.end, 'yyyy-MM-dd') : null

      const tz = profile?.timezone ?? 'UTC'

      try {
        // Get trends data (from RPC)
        const dailyResult = await supabase.rpc('daily_moment_counts_v1', {
          p_user: user.id,
          p_start: startStr,
          p_end: endStr,
          p_action: selectedAction,
          p_significant_only: significanceOnly,
          p_tz: tz
        })

        if (dailyResult.error) throw dailyResult.error

        // Get timeline data (direct query) for comparison
        const timelineData = await Promise.all(
          (dailyResult.data || []).map(async (trendsRow: any) => {
            let query = supabase
              .from('moments')
              .select('action', { count: 'exact' })
              .eq('user_id', user.id)
              .gte('happened_at', `${trendsRow.d}T00:00:00`)
              .lt('happened_at', `${trendsRow.d}T23:59:59`)

            // Apply action filter
            if (selectedAction !== 'both') {
              query = query.eq('action', selectedAction)
            }

            // Apply significance filter  
            if (significanceOnly) {
              query = query.eq('significance', true)
            }

            const { count: totalCount, error: totalError } = await query

            if (totalError) throw totalError

            // Get given/received breakdown if action is 'both'
            let givenCount = 0, receivedCount = 0
            if (selectedAction === 'both') {
              let givenQuery = supabase
                .from('moments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('action', 'given')
                .gte('happened_at', `${trendsRow.d}T00:00:00`)
                .lt('happened_at', `${trendsRow.d}T23:59:59`)

              if (significanceOnly) {
                givenQuery = givenQuery.eq('significance', true)
              }

              const { count: gCount } = await givenQuery

              let receivedQuery = supabase
                .from('moments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('action', 'received')
                .gte('happened_at', `${trendsRow.d}T00:00:00`)
                .lt('happened_at', `${trendsRow.d}T23:59:59`)

              if (significanceOnly) {
                receivedQuery = receivedQuery.eq('significance', true)
              }

              const { count: rCount } = await receivedQuery

              givenCount = gCount || 0
              receivedCount = rCount || 0
            } else if (selectedAction === 'given') {
              givenCount = totalCount || 0
            } else {
              receivedCount = totalCount || 0
            }

            return {
              date: trendsRow.d,
              trendsTotal: trendsRow.total,
              trendsGiven: trendsRow.given,
              trendsReceived: trendsRow.received,
              timelineTotal: totalCount || 0,
              timelineGiven: givenCount,
              timelineReceived: receivedCount,
              mismatch: trendsRow.total !== (totalCount || 0)
            }
          })
        )

        return timelineData.slice(0, 10) // Limit to 10 rows for display
      } catch (error) {
        throw error
      }
    },
    enabled: !!user?.id
  })

  const handleInvalidateCache = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['trends'] })
    await queryClient.invalidateQueries({ queryKey: ['dev-moment-counts'] })
    await queryClient.invalidateQueries({ queryKey: ['dev-rpc-test'] })
    await queryClient.invalidateQueries({ queryKey: ['dev-parity-check'] })
    setRefreshing(false)
  }

  const handleOpenTrends = () => {
    const params = new URLSearchParams()
    if (selectedRange !== '30d') params.set('range', selectedRange)
    if (selectedAction !== 'both') params.set('action', selectedAction)
    if (significanceOnly) params.set('significant', '1')
    navigate(`/trends?${params.toString()}`)
  }

  const hasActiveFilters = selectedAction !== 'both' || significanceOnly

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Not authenticated. Please log in to view trends debug info.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-2 flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Trends Debug Panel
        </h1>
        <p className="text-muted-foreground">
          Testing RPC functions and data integrity for trends analytics
        </p>
      </div>

      {/* Controls - Match Trends page */}
      <div className="flex flex-wrap gap-2 mb-6 p-3 sm:p-4 bg-muted/30 rounded-lg overflow-hidden">
        {/* Range Pills */}
        <div className="flex gap-1 sm:gap-2 flex-wrap min-w-0">
          {RANGE_OPTIONS.map(option => (
            <Button
              key={option.label}
              variant={selectedRange === option.label ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(option.label)}
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
              onClick={() => setSelectedAction(option.value as any)}
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
          onClick={() => setSignificanceOnly(!significanceOnly)}
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
          onClick={() => {
            setSelectedRange('all')
            setSelectedAction('both')
            setSignificanceOnly(false)
          }}
          disabled={selectedRange === 'all' && selectedAction === 'both' && !significanceOnly}
          className={cn(
            "text-xs sm:text-sm px-2 sm:px-3",
            selectedRange !== 'all' || selectedAction !== 'both' || significanceOnly
              ? "text-muted-foreground hover:text-foreground" 
              : "text-muted-foreground/50 cursor-not-allowed"
          )}
        >
          Clear filters
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button 
          onClick={handleInvalidateCache}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Invalidate Trends Cache
        </Button>
        <Button onClick={handleOpenTrends}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Open Trends {hasActiveFilters && '(with filters)'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information & SQL Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">User ID</Badge>
                <code className="text-sm bg-muted px-2 py-1 rounded">{user.id}</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Email</Badge>
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Timezone</Badge>
                <span className="text-sm">{profile?.timezone || 'UTC'}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="mb-2">
                <Badge variant="outline">SQL WHERE clause preview</Badge>
              </div>
              <code className="text-xs bg-muted p-3 rounded block">
                WHERE user_id = '{user.id}'
                {(() => {
                  const dateRange = getRange(selectedRange)
                  return dateRange 
                    ? ` AND happened_at::date BETWEEN '${format(dateRange.start, 'yyyy-MM-dd')}' AND '${format(dateRange.end, 'yyyy-MM-dd')}'`
                    : ' -- (no date filter for "all")'
                })()}
                {selectedAction !== 'both' && ` AND action = '${selectedAction}'`}
                {significanceOnly && ` AND significance = true`}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Moment Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Moment Counts by Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : countsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading moment counts: {countsError.message}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {momentCounts?.map(({ range, count, error }) => (
                  <div key={range} className="flex items-center gap-4">
                    <Badge variant="outline">{range}</Badge>
                    {error ? (
                      <span className="text-destructive text-sm">Error: {error.message}</span>
                    ) : (
                      <span className="text-sm font-medium">{count} moments</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart Parity Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Chart Parity Check: Trends vs Timeline
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Comparing RPC daily_moment_counts vs direct timeline queries for the same filters
            </p>
          </CardHeader>
          <CardContent>
            {parityLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : parityError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading parity data: {parityError.message}
                </AlertDescription>
              </Alert>
            ) : parityResults && parityResults.length > 0 ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">
                    {parityResults.filter(r => !r.mismatch).length} / {parityResults.length} matching
                  </Badge>
                  {parityResults.some(r => r.mismatch) && (
                    <Badge variant="destructive">
                      {parityResults.filter(r => r.mismatch).length} mismatches found
                    </Badge>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Trends Given</th>
                        <th className="text-right p-2">Trends Received</th>
                        <th className="text-right p-2">Trends Total</th>
                        <th className="text-right p-2">Timeline Total</th>
                        <th className="text-center p-2">Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parityResults.map((row, i) => (
                        <tr 
                          key={i} 
                          className={cn(
                            "border-b",
                            row.mismatch ? "bg-destructive/10" : "hover:bg-muted/50"
                          )}
                        >
                          <td className="p-2 font-medium">{row.date}</td>
                          <td className="p-2 text-right">{row.trendsGiven}</td>
                          <td className="p-2 text-right">{row.trendsReceived}</td>
                          <td className="p-2 text-right font-medium">{row.trendsTotal}</td>
                          <td className="p-2 text-right font-medium">{row.timelineTotal}</td>
                          <td className="p-2 text-center">
                            {row.mismatch ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Mismatch
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                OK
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No data available for comparison</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RPC Function Results */}
        <Card>
          <CardHeader>
            <CardTitle>RPC Function Test Results ({selectedRange}, first 5 rows)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Current filters: {selectedAction} action, {significanceOnly ? 'significant only' : 'all moments'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {rpcLoading ? (
              <div className="space-y-4">
                {['daily_moment_counts_v1', 'category_share_delta_v1', 'median_gap_by_category'].map((name) => (
                  <div key={name}>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            ) : rpcError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading RPC results: {rpcError.message}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-2 text-xs opacity-70">
                      <summary className="cursor-pointer">Debug info</summary>
                      <pre className="mt-1 whitespace-pre-wrap break-all">
                        {rpcError.toString()}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Daily Counts */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>daily_moment_counts_v1</Badge>
                    {rpcResults?.daily.error ? (
                      <Badge variant="destructive">
                        Error: {rpcResults.daily.error.code || 'Unknown'} 
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    )}
                  </div>
                  {rpcResults?.daily.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Code: {rpcResults.daily.error.code || 'N/A'}<br/>
                        Message: {rpcResults.daily.error.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                     <div className="bg-muted/30 p-3 rounded text-xs">
                       <pre className="whitespace-pre-wrap">
                         {JSON.stringify(rpcResults?.daily.data?.slice(0, 5), null, 2)}
                       </pre>
                     </div>
                  )}
                </div>

                {/* Category Share */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>category_share_delta_v1</Badge>
                    {rpcResults?.category.error ? (
                      <Badge variant="destructive">
                        Error: {rpcResults.category.error.code || 'Unknown'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    )}
                  </div>
                  {rpcResults?.category.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Code: {rpcResults.category.error.code || 'N/A'}<br/>
                        Message: {rpcResults.category.error.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="bg-muted/30 p-3 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                         {JSON.stringify(
                           rpcResults?.category.data?.map(row => ({
                             ...row,
                             pct_formatted: row.pct ? formatPct1(row.pct) : 'N/A'
                           })), 
                           null, 
                           2
                         )}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Median Gaps */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>median_gap_by_category</Badge>
                    {rpcResults?.median.error ? (
                      <Badge variant="destructive">
                        Error: {rpcResults.median.error.code || 'Unknown'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    )}
                  </div>
                  {rpcResults?.median.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Code: {rpcResults.median.error.code || 'N/A'}<br/>
                        Message: {rpcResults.median.error.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="bg-muted/30 p-3 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(
                          rpcResults?.median.data?.map(row => ({
                            ...row,
                            median_days_formatted: row.median_days ? `${formatNum.format(row.median_days)} days` : 'N/A'
                          })), 
                          null, 
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Raw Daily Data Debug Row */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Raw Daily Data (Debug)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Raw daily counts for current filters - verify Jul 28 shows 1, Jul 29 shows 4
            </p>
          </CardHeader>
          <CardContent>
            {rpcLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : rpcError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading daily data: {rpcError.message}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="bg-muted/30 p-3 rounded text-xs max-h-60 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Date</th>
                      <th className="text-right py-1">Given</th>
                      <th className="text-right py-1">Received</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                   <tbody>
                     {rpcResults?.daily.data?.map((row: any) => (
                       <tr key={row.d} className="border-b border-border/30">
                         <td className="py-1 font-mono">{row.d}</td>
                         <td className="text-right py-1">{row.given}</td>
                         <td className="text-right py-1">{row.received}</td>
                         <td className="text-right py-1 font-semibold">{row.total}</td>
                       </tr>
                     ))}
                   </tbody>
                </table>
                {(!rpcResults?.daily.data || rpcResults.daily.data.length === 0) && (
                  <p className="text-center py-4 text-muted-foreground">No daily data found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}