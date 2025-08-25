import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { format } from 'date-fns'
import type { DateRangeLabel } from '@/lib/dateRange'

interface WeeklyPatternData {
  weekday: number
  weekday_name: string
  count: number
}

interface UseWeeklyPatternsOptions {
  range: DateRangeLabel
  action: 'given' | 'received' | 'both'
  significance: boolean
}

export const useWeeklyPatterns = (options: UseWeeklyPatternsOptions) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['weeklyPatterns', user?.id, options.range, options.action, options.significance],
    queryFn: async (): Promise<WeeklyPatternData[]> => {
      if (!user?.id) throw new Error('User not authenticated')

      // Get user timezone first
      const { data: userTz, error: tzError } = await supabase.rpc('user_tz', { p_user: user.id })
      if (tzError) {
        console.warn('Could not fetch user timezone:', tzError)
      }
      const timezone = userTz || 'UTC'

      // Calculate date ranges
      let startDateStr: string | null = null
      let endDateStr: string | null = null

      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')

      if (options.range === 'all') {
        startDateStr = null
        endDateStr = null
      } else {
        let daysBack: number
        switch (options.range) {
          case '7d':
            daysBack = 6
            break
          case '30d':
            daysBack = 29
            break
          case '90d':
            daysBack = 89
            break
          case '365d':
            daysBack = 364
            break
          default:
            daysBack = 29
        }
        
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - daysBack)
        
        startDateStr = format(startDate, 'yyyy-MM-dd')
        endDateStr = todayStr
      }

      const { data, error } = await supabase.rpc('weekly_patterns', {
        p_user: user.id,
        p_start: startDateStr,
        p_end: endDateStr,
        p_action: options.action,
        p_significant_only: options.significance,
        p_tz: timezone
      })

      if (error) throw new Error(`Weekly patterns error: ${error.message}`)

      return data || []
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false
  })
}