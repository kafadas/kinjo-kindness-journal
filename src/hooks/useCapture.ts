import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { useOptimisticUpdates } from '@/hooks/useOptimisticUpdates'

interface CaptureData {
  text: string
  seedPerson?: string
  seedCategory?: string
}

export const useCapture = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user, session, isAuthenticated } = useAuth()
  const { addMomentOptimistically, rollbackMomentOptimistically } = useOptimisticUpdates()

  const capture = async ({ text, seedPerson, seedCategory }: CaptureData) => {
    setLoading(true)
    let capturedData: any = null

    try {
      // Check authentication first
      if (!isAuthenticated || !user || !session) {
        console.error('Capture attempt without authentication:', { isAuthenticated, user: !!user, session: !!session })
        throw new Error('You must be logged in to capture moments')
      }

      const requestBody = { text, seedPerson, seedCategory }
      console.log('Capture request - Auth status:', { 
        isAuthenticated, 
        userId: user.id, 
        hasSession: !!session,
        requestBody 
      })

      const { data, error } = await supabase.functions.invoke('capture-text', {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (error) {
        console.error('Supabase function invoke error:', error)
        throw error
      }

      console.log('Capture response received:', data)
      capturedData = data

      // Add optimistic update
      if (data?.moment) {
        addMomentOptimistically(data.moment)
      }

      toast({
        title: 'Moment captured!',
        description: 'Your kindness has been recorded.',
      })

      return data
    } catch (err: any) {
      console.error('Error capturing moment:', err)
      
      // Rollback optimistic update if there was one
      if (capturedData?.moment?.id) {
        rollbackMomentOptimistically(capturedData.moment.id)
      }
      
      let errorMessage = 'Failed to capture moment. Please try again.'
      
      if (err.message?.includes('logged in')) {
        errorMessage = 'Please log in to capture moments.'
      } else if (err.message?.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please refresh and try again.'
      } else if (err.message?.includes('Invalid request')) {
        errorMessage = 'Invalid request. Please check your input.'
      }
      
      toast({
        title: 'Capture failed',
        description: errorMessage,
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { capture, loading }
}