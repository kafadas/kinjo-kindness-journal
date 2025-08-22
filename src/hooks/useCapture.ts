import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface CaptureData {
  text: string
  seedPerson?: string
  seedCategory?: string
}

export const useCapture = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user, session, isAuthenticated } = useAuth()

  const capture = async ({ text, seedPerson, seedCategory }: CaptureData) => {
    setLoading(true)

    try {
      console.log('=== Capture Hook Called ===')
      console.log('Input:', { text, seedPerson, seedCategory })
      
      // Validate input
      if (!text || text.trim() === '') {
        throw new Error('Text is required to capture a moment')
      }
      
      // Check authentication first
      if (!isAuthenticated || !user || !session) {
        console.error('Authentication check failed:', { 
          isAuthenticated, 
          hasUser: !!user, 
          hasSession: !!session 
        })
        throw new Error('You must be logged in to capture moments')
      }

      // Check session expiry and refresh if needed
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now + 300) { // Refresh if expiring in 5 minutes
        console.log('Session expiring soon, refreshing...')
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !newSession) {
          console.error('Session refresh failed:', refreshError)
          throw new Error('Your session has expired. Please log in again.')
        }
        console.log('Session refreshed successfully')
      }

      const requestBody = { text: text.trim(), seedPerson, seedCategory }
      console.log('=== Making API Call ===')
      console.log('Auth status:', { 
        isAuthenticated, 
        userId: user.id, 
        sessionExpiresAt: session.expires_at,
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length
      })
      console.log('Request body stringified:', JSON.stringify(requestBody))
      console.log('Request body size:', new Blob([JSON.stringify(requestBody)]).size, 'bytes')

      const { data, error } = await supabase.functions.invoke('capture-text', {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('=== API Response ===')
      console.log('Response data:', data)
      console.log('Response error:', error)

      if (error) {
        console.error('Supabase function invoke error:', error)
        throw error
      }

      toast({
        title: 'Moment captured!',
        description: 'Your kindness has been recorded.',
      })

      return data
    } catch (err: any) {
      console.error('Error capturing moment:', err)
      
      let errorMessage = 'Failed to capture moment. Please try again.'
      
      // Handle specific error codes from edge function
      if (err.message?.includes('logged in') || err.message?.includes('session has expired')) {
        errorMessage = 'Please log in to capture moments.'
      } else if (err.message?.includes('Unauthorized') || err.message?.includes('Authentication failed')) {
        errorMessage = 'Authentication failed. Please refresh and try again.'
      } else if (err.message?.includes('Invalid request') || err.message?.includes('EMPTY_BODY')) {
        errorMessage = 'Invalid request. Please check your input.'
      } else if (err.message?.includes('Database insertion failed')) {
        errorMessage = 'Database error. Please try again or contact support.'
      } else if (err.message?.includes('JSON_PARSE_ERROR')) {
        errorMessage = 'Request formatting error. Please try again.'
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