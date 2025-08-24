import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

interface SaveQuickMomentInput {
  text: string
  seedCategoryId?: string
  seedPersonId?: string
  action?: 'given' | 'received'
  significant?: boolean
  happenedAtClient?: string
}

export const useSaveQuickMoment = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()

  const saveQuickMoment = async (input: SaveQuickMomentInput) => {
    if (!isAuthenticated || !user) {
      throw new Error('You must be logged in to save moments')
    }

    const {
      text,
      seedCategoryId,
      seedPersonId,
      action = 'given',
      significant = false,
      happenedAtClient
    } = input

    // Use server time - don't trust client clock
    const happened_at = new Date().toISOString()

    try {
      const { data, error } = await supabase
        .from('moments')
        .insert({
          description: text.trim(),
          category_id: seedCategoryId || null,
          person_id: seedPersonId || null,
          action,
          significance: significant,
          happened_at,
          user_id: user.id,
          source: 'text'
        })
        .select(`
          *,
          person:people(id, display_name),
          category:categories(id, name)
        `)
        .single()

      if (error) {
        console.error('Save moment error:', error)
        
        // Handle different error types
        if (error.message?.includes('row-level security')) {
          throw new Error('Authentication failed. Please refresh and try again.')
        }
        
        throw new Error(process.env.NODE_ENV === 'development' 
          ? error.message 
          : "Couldn't save. Please try again."
        )
      }

      // Success toast
      toast({
        title: 'Saved',
        description: 'Your moment has been captured.',
      })

      // Invalidate and refetch relevant queries
      await Promise.all([
        // Timeline
        queryClient.invalidateQueries({ queryKey: ['moments'] }),
        // Category details if seeded
        seedCategoryId && queryClient.invalidateQueries({ queryKey: ['category-moments', seedCategoryId] }),
        // Person details if seeded  
        seedPersonId && queryClient.invalidateQueries({ queryKey: ['person-moments', seedPersonId] }),
        // Trends aggregates
        queryClient.invalidateQueries({ queryKey: ['trends'] }),
        queryClient.invalidateQueries({ queryKey: ['insights'] }),
        // Home insights
        queryClient.invalidateQueries({ queryKey: ['home-insights'] }),
      ].filter(Boolean))

      return data
    } catch (error: any) {
      console.error('Error saving moment:', error)
      
      const isDev = process.env.NODE_ENV === 'development'
      const errorMessage = error.message || (isDev 
        ? 'Unknown error occurred'
        : "Couldn't save. Please try again."
      )
      
      toast({
        title: 'Save failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }

  return { saveQuickMoment }
}