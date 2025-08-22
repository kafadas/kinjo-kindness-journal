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

export const useCategoryDetails = (categoryId: string) => {
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
    queryKey: ['category-moments', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moments')
        .select(`
          *,
          person:people(*)
        `)
        .eq('category_id', categoryId)
        .order('happened_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!categoryId
  })

  const { data: stats } = useQuery({
    queryKey: ['category-stats', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moments')
        .select('action, person_id')
        .eq('category_id', categoryId)

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