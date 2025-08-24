import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

interface MonthlyOverviewData {
  current_month_count: number
  previous_month_count: number
}

interface UseMonthlyOverviewOptions {
  action: 'given' | 'received' | 'both'
  significance: boolean
}

export const useMonthlyOverview = (options: UseMonthlyOverviewOptions) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['monthlyOverview', user?.id, options.action, options.significance],
    queryFn: async (): Promise<MonthlyOverviewData | null> => {
      if (!user?.id) throw new Error('User not authenticated')

      // Get user timezone first 
      const { data: userTz, error: tzError } = await supabase.rpc('user_tz', { p_user: user.id })
      if (tzError) {
        console.warn('Could not fetch user timezone:', tzError)
      }
      const timezone = userTz || 'UTC'

      const { data, error } = await supabase.rpc('monthly_overview', {
        p_user: user.id,
        p_action: options.action,
        p_significant_only: options.significance,
        p_tz: timezone
      })

      if (error) throw new Error(`Monthly overview error: ${error.message}`)

      return data && data.length > 0 ? data[0] : null
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false
  })
}