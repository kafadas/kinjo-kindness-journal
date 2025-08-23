import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface TrendsData {
  seriesDaily: {
    date: string
    total: number
    given: number
    received: number
  }[]
  categoryShare: {
    category_id: string
    name: string
    pct: number
    delta_pct: number
  }[]
  medianGaps: {
    category_id: string
    name: string
    median_days: number
  }[]
}

interface UseTrendsOptions {
  range: number // days
  action?: 'given' | 'received' | 'both'
  significance?: boolean
}

export const useTrends = (options: UseTrendsOptions) => {
  return useQuery({
    queryKey: ['trends', options],
    queryFn: async (): Promise<TrendsData> => {
      const params = new URLSearchParams({
        range: options.range.toString(),
        ...(options.action && options.action !== 'both' && { action: options.action }),
        ...(options.significance && { significance: 'true' })
      })

      const url = `trends-data?${params}`
      const { data, error } = await supabase.functions.invoke(url)

      if (error) {
        console.error('Trends data error:', error)
        throw new Error('Failed to fetch trends data')
      }

      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}