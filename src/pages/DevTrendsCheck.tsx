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
import { RefreshCw, ExternalLink, Database, User, Calendar, BarChart3, AlertCircle, CheckCircle } from 'lucide-react'
import { RANGE_OPTIONS, type DateRangeLabel, getRange } from '@/lib/dateRange'
import { format } from 'date-fns'

export const DevTrendsCheck: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

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

  // Moment counts for different ranges
  const { data: momentCounts, isLoading: countsLoading, error: countsError } = useQuery({
    queryKey: ['dev-moment-counts', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const ranges: DateRangeLabel[] = ['30d', '90d', '120d']
      const results = await Promise.all(
        ranges.map(async (rangeLabel) => {
          const { start } = getRange(rangeLabel)
          const { count, error } = await supabase
            .from('moments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('happened_at', start.toISOString())
          
          return { range: rangeLabel, count, error }
        })
      )
      
      return results
    },
    enabled: !!user?.id
  })

  // Test RPC functions
  const { data: rpcResults, isLoading: rpcLoading, error: rpcError } = useQuery({
    queryKey: ['dev-rpc-test', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { start, end } = getRange('90d')
      const startStr = format(start, 'yyyy-MM-dd')
      const endStr = format(end, 'yyyy-MM-dd')

      try {
        const [dailyResult, categoryResult, medianResult] = await Promise.all([
          supabase.rpc('daily_moment_counts', {
            p_user: user.id,
            p_start: startStr,
            p_end: endStr
          }),
          supabase.rpc('category_share_delta', {
            p_user: user.id,
            p_start: startStr,
            p_end: endStr
          }),
          supabase.rpc('median_gap_by_category', {
            p_user: user.id,
            p_start: startStr,
            p_end: endStr
          })
        ])

        return {
          daily: { data: dailyResult.data?.slice(0, 5), error: dailyResult.error },
          category: { data: categoryResult.data?.slice(0, 5), error: categoryResult.error },
          median: { data: medianResult.data?.slice(0, 5), error: medianResult.error }
        }
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
    setRefreshing(false)
  }

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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-2 flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Trends Debug Panel
        </h1>
        <p className="text-muted-foreground">
          Testing RPC functions and data integrity for trends analytics
        </p>
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
        <Button onClick={() => navigate('/trends')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Open Trends
        </Button>
      </div>

      <div className="grid gap-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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

        {/* RPC Function Results */}
        <Card>
          <CardHeader>
            <CardTitle>RPC Function Test Results (90 days, first 5 rows)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {rpcLoading ? (
              <div className="space-y-4">
                {['daily_moment_counts', 'category_share_delta', 'median_gap_by_category'].map((name) => (
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
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Daily Counts */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>daily_moment_counts</Badge>
                    {rpcResults?.daily.error ? (
                      <Badge variant="destructive">Error</Badge>
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
                        {rpcResults.daily.error.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="bg-muted/30 p-3 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(rpcResults?.daily.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Category Share */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>category_share_delta</Badge>
                    {rpcResults?.category.error ? (
                      <Badge variant="destructive">Error</Badge>
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
                        {rpcResults.category.error.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="bg-muted/30 p-3 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(rpcResults?.category.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Median Gaps */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>median_gap_by_category</Badge>
                    {rpcResults?.median.error ? (
                      <Badge variant="destructive">Error</Badge>
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
                        {rpcResults.median.error.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="bg-muted/30 p-3 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(rpcResults?.median.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}