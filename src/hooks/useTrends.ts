import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { format } from 'date-fns'
import { getRange, type DateRangeLabel } from '@/lib/dateRange'

interface DailyData {
  date: string
  total: number
  given: number
  received: number
}

interface CategoryData {
  category_id: string
  name: string
  pct: number
  delta_pct: number
}

interface MedianData {
  category_id: string
  name: string
  median_days: number
}

interface TrendsData {
  seriesDaily: DailyData[]
  categoryShare: CategoryData[]
  medianGaps: MedianData[]
  dateRange?: { start: Date; end: Date } | null
  givenReceivedRatio: number // Percentage of given moments
}

interface UseTrendsOptions {
  range: DateRangeLabel
  action: 'given' | 'received' | 'both'
  significance: boolean
}

export const useTrends = (options: UseTrendsOptions) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['trends', user?.id, options.range, options.action, options.significance],
    queryFn: async (): Promise<TrendsData> => {
      if (!user?.id) throw new Error('User not authenticated')

      // Get user profile for timezone
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('user_id', user.id)
        .single()

      const tz = profile?.timezone || 'UTC'

      // Calculate date range - null for "all" to include entire history
      const dateRange = options.range === 'all' ? null : getRange(options.range)
      
      let startDateStr: string | null = null
      let endDateStr: string | null = null
      
      if (dateRange) {
        startDateStr = format(dateRange.start, 'yyyy-MM-dd')
        endDateStr = format(dateRange.end, 'yyyy-MM-dd')
      }

      try {
        // For "all" range, get the user's date bounds for chart domain
        let chartDateRange: { start: Date; end: Date } | null = null
        if (options.range === 'all') {
          const { data: rangeData, error: rangeError } = await supabase.rpc('get_user_moment_date_range', {
            p_user: user.id
          })
          
          if (rangeError) {
            console.warn('Could not fetch date range:', rangeError)
          } else if (rangeData && rangeData.length > 0 && rangeData[0].min_date && rangeData[0].max_date) {
            chartDateRange = {
              start: new Date(rangeData[0].min_date + 'T00:00:00'),
              end: new Date(rangeData[0].max_date + 'T23:59:59')
            }
          }
        } else if (dateRange) {
          chartDateRange = dateRange
        }

        // Call the three RPC functions in parallel
        const [dailyResult, categoryResult, medianResult] = await Promise.all([
          supabase.rpc('daily_moment_counts_v1', {
            p_user: user.id,
            p_start: startDateStr,
            p_end: endDateStr,
            p_action: options.action,
            p_significant_only: options.significance,
            p_tz: tz
          }),
          supabase.rpc('category_share_delta_v1', {
            p_user: user.id,
            p_start: startDateStr,
            p_end: endDateStr,
            p_action: options.action,
            p_significant_only: options.significance,
            p_tz: tz
          }),
          supabase.rpc('median_gap_by_category', {
            p_user: user.id,
            p_start: startDateStr,
            p_end: endDateStr,
            p_action: options.action,
            p_significant_only: options.significance
          })
        ])

        // Check for errors
        if (dailyResult.error) throw new Error(`Daily data error: ${dailyResult.error.message}`)
        if (categoryResult.error) throw new Error(`Category data error: ${categoryResult.error.message}`)
        if (medianResult.error) throw new Error(`Median data error: ${medianResult.error.message}`)

        // Transform the data to match expected format
        const seriesDaily: DailyData[] = (dailyResult.data || []).map(row => ({
          date: row.d,
          total: row.total,
          given: row.given_count,
          received: row.received_count
        }))

        const categoryShare: CategoryData[] = (categoryResult.data || []).map(row => ({
          category_id: row.category_id,
          name: row.category_name,
          pct: parseFloat(row.pct.toString()), // Already in percentage format
          delta_pct: 0 // v1 function doesn't include delta, set to 0 for now
        }))

        const medianGaps: MedianData[] = (medianResult.data || []).map(row => ({
          category_id: row.category_id,
          name: row.name,
          median_days: parseFloat(row.median_days?.toString() || '0')
        })).filter(row => row.median_days > 0) // Filter out categories with no gaps

        // Calculate Given vs Received ratio from the filtered dataset
        const totalMoments = seriesDaily.reduce((sum, day) => sum + day.total, 0)
        const givenMoments = seriesDaily.reduce((sum, day) => sum + day.given, 0)
        const givenReceivedRatio = totalMoments > 0 ? (givenMoments / totalMoments) : 0

        return {
          seriesDaily,
          categoryShare,
          medianGaps,
          dateRange: chartDateRange,
          givenReceivedRatio
        }
      } catch (error) {
        console.error('Trends data error:', error)
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch trends data')
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false
  })
}