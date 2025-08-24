import { useState, useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { MomentWithRelations } from '@/lib/db/types'

export interface TimelineFilters {
  search?: string
  dateRange?: {
    from: Date
    to: Date
  }
  action?: 'given' | 'received' | null
  categoryId?: string
  personId?: string
  tags?: string[]
  significance?: boolean
}

export const useTimeline = (filters: TimelineFilters = {}, limit = 20) => {
  const queryClient = useQueryClient()

  // Get user timezone
  const { data: userTimezone } = useQuery({
    queryKey: ['user-timezone'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .single()
      return profile?.timezone || 'UTC'
    }
  })

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['timeline', filters, limit],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('moments')
        .select(`
          *,
          person:people(*),
          category:categories(*)
        `)
        .order('happened_at', { ascending: false })
        .range(pageParam * limit, (pageParam + 1) * limit - 1)

      // Apply filters
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.personId) {
        query = query.eq('person_id', filters.personId)
      }

      if (filters.significance !== undefined) {
        query = query.eq('significance', filters.significance)
      }

      // Timezone-aware date filtering for inclusive date ranges
      if (filters.dateRange) {
        query = query.gte('happened_at', filters.dateRange.from.toISOString())
        query = query.lte('happened_at', filters.dateRange.to.toISOString())
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      const { data, error } = await query

      if (error) throw error
      return data as MomentWithRelations[]
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length : undefined
    },
    initialPageParam: 0
  })

  // Flatten all pages into a single array
  const moments = useMemo(() => {
    return data?.pages.flat() || []
  }, [data])

  const updateMomentMutation = useMutation({
    mutationFn: async ({ momentId, updates }: { momentId: string, updates: any }) => {
      const { error } = await supabase
        .from('moments')
        .update(updates)
        .eq('id', momentId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['moments'] })
      toast.success('Moment updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update moment: ' + error.message)
    }
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ momentIds, updates }: { momentIds: string[], updates: any }) => {
      const { error } = await supabase
        .from('moments')
        .update(updates)
        .in('id', momentIds)

      if (error) throw error
      return momentIds.length
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['moments'] })
      toast.success(`Updated ${count} moments successfully`)
    },
    onError: (error) => {
      toast.error('Failed to update moments: ' + error.message)
    }
  })

  const deleteMomentMutation = useMutation({
    mutationFn: async (momentId: string) => {
      const { error } = await supabase
        .from('moments')
        .delete()
        .eq('id', momentId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['moments'] })
      toast.success('Moment deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete moment: ' + error.message)
    }
  })

  return {
    moments,
    userTimezone: userTimezone || 'UTC',
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    updateMoment: updateMomentMutation.mutate,
    isUpdating: updateMomentMutation.isPending,
    bulkUpdate: bulkUpdateMutation.mutate,
    isBulkUpdating: bulkUpdateMutation.isPending,
    deleteMoment: deleteMomentMutation.mutate,
    isDeleting: deleteMomentMutation.isPending
  }
}