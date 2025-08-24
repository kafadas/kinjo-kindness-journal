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

      // Get user timezone first and cache it for the session
      const { data: userTz, error: tzError } = await supabase.rpc('user_tz', { p_user: user.id })
      if (tzError) {
        console.warn('Could not fetch user timezone:', tzError)
      }
      const timezone = userTz || 'UTC'

      // Calculate date ranges using specific calculations
      let startDateStr: string | null = null
      let endDateStr: string | null = null
      let chartDateRange: { start: Date; end: Date } | null = null

      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')

      if (options.range === 'all') {
        startDateStr = null
        endDateStr = null
        
        // For "all" range, get the user's actual date bounds for chart domain
        const { data: rangeData, error: rangeError } = await supabase.rpc('get_user_moment_date_range', {
          p_user: user.id
        })
        
        if (!rangeError && rangeData && rangeData.length > 0 && rangeData[0].min_date && rangeData[0].max_date) {
          chartDateRange = {
            start: new Date(rangeData[0].min_date + 'T00:00:00'),
            end: new Date(rangeData[0].max_date + 'T23:59:59')
          }
        }
      } else {
        // Specific range calculations as requested
        let daysBack: number
        switch (options.range) {
          case '30d':
            daysBack = 29 // today - 29 = 30 days total
            break
          case '90d':
            daysBack = 89 // today - 89 = 90 days total
            break
          case '120d':
            daysBack = 119 // today - 119 = 120 days total
            break
          case '1y':
            daysBack = 364 // today - 364 = 365 days total
            break
          default:
            daysBack = 29
        }
        
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - daysBack)
        
        startDateStr = format(startDate, 'yyyy-MM-dd')
        endDateStr = todayStr
        
        chartDateRange = {
          start: startDate,
          end: today
        }
      }

      try {
        // Call the three RPC functions in parallel
        const [dailyResult, categoryResult, medianResult] = await Promise.all([
          supabase.rpc('daily_moment_counts', {
            p_user: user.id,
            p_start: startDateStr,
            p_end: endDateStr,
            p_action: options.action,
            p_significant_only: options.significance,
            p_tz: timezone
          }),
          supabase.rpc('category_share_delta', {
            p_user: user.id,
            p_start: startDateStr,
            p_end: endDateStr,
            p_action: options.action,
            p_significant_only: options.significance,
            p_tz: timezone
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
          given: row.given,
          received: row.received
        }))

        const categoryShare: CategoryData[] = (categoryResult.data || []).map(row => ({
          category_id: row.category_id,
          name: row.category_name,
          pct: parseFloat(row.pct.toString()) // Already in percentage from function
        }))

        const medianGaps: MedianData[] = (medianResult.data || []).map(row => ({
          category_id: row.category_id,
          name: row.name,
          median_days: parseFloat(row.median_days?.toString() || '0')
        })).filter(row => row.median_days > 0) // Filter out categories with no gaps

        return {
          seriesDaily,
          categoryShare,
          medianGaps,
          dateRange: chartDateRange
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