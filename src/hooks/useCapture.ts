import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface CaptureData {
  text: string
  seedPerson?: string
  seedCategory?: string
}

export const useCapture = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const capture = async ({ text, seedPerson, seedCategory }: CaptureData) => {
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('capture-text', {
        body: { text, seedPerson, seedCategory },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Moment captured!',
        description: 'Your kindness has been recorded.',
      })

      return data
    } catch (err: any) {
      console.error('Error capturing moment:', err)
      toast({
        title: 'Capture failed',
        description: err.message || 'Failed to capture moment. Please try again.',
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { capture, loading }
}