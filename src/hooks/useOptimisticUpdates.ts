import { useQueryClient } from '@tanstack/react-query'
import type { MomentWithRelations } from '@/lib/db/types'

export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient()

  const addMomentOptimistically = (moment: MomentWithRelations) => {
    // Update timeline
    queryClient.setQueryData(['moments'], (old: any) => {
      if (!old) return [moment]
      return [moment, ...old]
    })

    // Update category moments if applicable
    if (moment.category_id) {
      queryClient.setQueryData(['category-moments', moment.category_id], (old: any) => {
        if (!old) return [moment]
        return [moment, ...old]
      })
    }

    // Update person moments if applicable
    if (moment.person_id) {
      queryClient.setQueryData(['person-moments', moment.person_id], (old: any) => {
        if (!old) return [moment]
        return [moment, ...old]
      })
    }
  }

  const rollbackMomentOptimistically = (momentId: string) => {
    // Remove from timeline
    queryClient.setQueryData(['moments'], (old: any) => {
      if (!old) return old
      return old.filter((m: any) => m.id !== momentId)
    })

    // Remove from category moments
    queryClient.setQueriesData({ queryKey: ['category-moments'] }, (old: any) => {
      if (!old) return old
      return old.filter((m: any) => m.id !== momentId)
    })

    // Remove from person moments
    queryClient.setQueriesData({ queryKey: ['person-moments'] }, (old: any) => {
      if (!old) return old
      return old.filter((m: any) => m.id !== momentId)
    })
  }

  return {
    addMomentOptimistically,
    rollbackMomentOptimistically
  }
}