import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { HomeInsights } from '@/lib/db/types'

export const useInsights = (range = 'last_30d') => {
  const [insights, setInsights] = useState<HomeInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: functionError } = await supabase.functions.invoke('insights-home', {
        body: { range },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (functionError) {
        throw functionError
      }

      setInsights(data)
    } catch (err: any) {
      console.error('Error fetching insights:', err)
      setError(err.message || 'Failed to fetch insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [range])

  return { insights, loading, error, refetch: fetchInsights }
}