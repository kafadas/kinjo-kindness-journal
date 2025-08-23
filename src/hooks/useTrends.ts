import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { format, subDays } from 'date-fns'

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
}

interface UseTrendsOptions {
  range: number // days
  action?: 'given' | 'received' | 'both'
  significance?: boolean
}

export const useTrends = (options: UseTrendsOptions) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['trends', user?.id, options],
    queryFn: async (): Promise<TrendsData> => {
      if (!user?.id) throw new Error('User not authenticated')

      // Calculate date range
      const endDate = new Date()
      const startDate = subDays(endDate, options.range)
      
      const startDateStr = format(startDate, 'yyyy-MM-dd')
      const endDateStr = format(endDate, 'yyyy-MM-dd')

      try {
        // Call the three RPC functions in parallel
        const [dailyResult, categoryResult, medianResult] = await Promise.all([
          supabase.rpc('daily_moment_counts', {
            p_user: user.id,
            p_start: startDateStr,
            p_end: endDateStr
          }),
          supabase.rpc('category_share_delta', {
            p_user: user.id,
            p_start: startDateStr,
            p_end: endDateStr
          }),
          supabase.rpc('median_gap_by_category', {
            p_user: user.id,
            p_start: startDateStr,
            p_end: endDateStr
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
          name: row.name,
          pct: parseFloat(row.pct.toString()) * 100, // Convert to percentage
          delta_pct: parseFloat(row.delta_pct.toString()) * 100
        }))

        const medianGaps: MedianData[] = (medianResult.data || []).map(row => ({
          category_id: row.category_id,
          name: row.name,
          median_days: parseFloat(row.median_days?.toString() || '0')
        })).filter(row => row.median_days > 0) // Filter out categories with no gaps

        return {
          seriesDaily,
          categoryShare,
          medianGaps
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