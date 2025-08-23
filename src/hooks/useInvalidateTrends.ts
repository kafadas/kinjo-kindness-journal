import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'

export const useInvalidateTrends = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['trends', user.id] })
    }
  }
}