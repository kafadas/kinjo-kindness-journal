import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCategories, createCategory as dbCreateCategory } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Category, CreateCategory } from '@/lib/db/types'

export const useCategories = () => {
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await getCategories()
      // Get moment counts for each category
      const categoriesWithCounts = await Promise.all(
        cats.map(async (category) => {
          const { data: moments, error } = await supabase
            .from('moments')
            .select('id')
            .eq('category_id', category.id)
          
          return {
            ...category,
            entry_count: moments?.length || 0
          }
        })
      )
      return categoriesWithCounts
    }
  })

  const createCategoryMutation = useMutation({
    mutationFn: (category: CreateCategory) => dbCreateCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create category: ' + error.message)
    }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete category: ' + error.message)
    }
  })

  return {
    categories,
    isLoading,
    error,
    createCategory: createCategoryMutation.mutate,
    isCreating: createCategoryMutation.isPending,
    deleteCategory: deleteCategoryMutation.mutate,
    isDeleting: deleteCategoryMutation.isPending
  }
}

export const useCategoryDetails = (
  categoryId: string,
  filters?: {
    range?: string
    action?: 'both' | 'given' | 'received'
    significant?: boolean
  }
) => {
  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single()

      if (error) throw error
      return data as Category
    },
    enabled: !!categoryId
  })

  const { data: moments = [], isLoading: isLoadingMoments } = useQuery({
    queryKey: ['category-moments', categoryId, filters?.range, filters?.action, filters?.significant],
    queryFn: async () => {
      let query = supabase
        .from('moments')
        .select(`
          *,
          person:people(*)
        `)
        .eq('category_id', categoryId)

      // Apply date range filter if specified
      if (filters?.range && filters.range !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (filters.range) {
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          case '120d':
            startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
            break
          case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }
        
        query = query.gte('happened_at', startDate.toISOString())
      }

      // Apply action filter if specified
      if (filters?.action && filters.action !== 'both') {
        query = query.eq('action', filters.action)
      }

      // Apply significance filter if specified
      if (filters?.significant) {
        query = query.eq('significance', true)
      }

      query = query.order('happened_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!categoryId
  })

  const { data: stats } = useQuery({
    queryKey: ['category-stats', categoryId, filters?.range, filters?.action, filters?.significant],
    queryFn: async () => {
      let query = supabase
        .from('moments')
        .select('action, person_id')
        .eq('category_id', categoryId)

      // Apply same filters to stats
      if (filters?.range && filters.range !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (filters.range) {
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          case '120d':
            startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
            break
          case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }
        
        query = query.gte('happened_at', startDate.toISOString())
      }

      if (filters?.action && filters.action !== 'both') {
        query = query.eq('action', filters.action)
      }

      if (filters?.significant) {
        query = query.eq('significance', true)
      }

      const { data, error } = await query

      if (error) throw error

      const given = data.filter(m => m.action === 'given').length
      const received = data.filter(m => m.action === 'received').length
      const uniquePeople = new Set(data.map(m => m.person_id)).size

      return { given, received, total: given + received, uniquePeople }
    },
    enabled: !!categoryId
  })

  return {
    category,
    moments,
    stats,
    isLoading: isLoadingCategory || isLoadingMoments
  }
}