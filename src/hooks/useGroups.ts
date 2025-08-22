import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/db'
import { toast } from 'sonner'
import type { Group, Person } from '@/lib/db/types'

export const useGroups = () => {
  const queryClient = useQueryClient()

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          person_groups(
            person:people(*)
          )
        `)
        .order('sort_order')

      if (error) throw error
      return data.map(group => ({
        ...group,
        people: group.person_groups?.map((pg: any) => pg.person).filter(Boolean) || []
      }))
    }
  })

  const createGroupMutation = useMutation({
    mutationFn: async (group: { name: string; emoji?: string }) => {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: group.name,
          emoji: group.emoji,
          sort_order: groups.length,
          user_id: userId
        })
        .select()
        .single()

      if (error) throw error
      return data as Group
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Group created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create group: ' + error.message)
    }
  })

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // First, remove all people from the group
      const { error: removeError } = await supabase
        .from('person_groups')
        .delete()
        .eq('group_id', groupId)

      if (removeError) throw removeError

      // Then delete the group
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Group deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete group: ' + error.message)
    }
  })

  const addPersonToGroupMutation = useMutation({
    mutationFn: async ({ groupId, personId }: { groupId: string; personId: string }) => {
      const { error } = await supabase
        .from('person_groups')
        .insert({
          group_id: groupId,
          person_id: personId
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Person added to group')
    },
    onError: (error) => {
      toast.error('Failed to add person to group: ' + error.message)
    }
  })

  const removePersonFromGroupMutation = useMutation({
    mutationFn: async ({ groupId, personId }: { groupId: string; personId: string }) => {
      const { error } = await supabase
        .from('person_groups')
        .delete()
        .eq('group_id', groupId)
        .eq('person_id', personId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Person removed from group')
    },
    onError: (error) => {
      toast.error('Failed to remove person from group: ' + error.message)
    }
  })

  return {
    groups,
    isLoading,
    error,
    createGroup: createGroupMutation.mutate,
    createGroupAsync: createGroupMutation.mutateAsync,
    isCreating: createGroupMutation.isPending,
    deleteGroup: deleteGroupMutation.mutate,
    isDeleting: deleteGroupMutation.isPending,
    addPersonToGroup: addPersonToGroupMutation.mutate,
    addPersonToGroupAsync: addPersonToGroupMutation.mutateAsync,
    removePersonFromGroup: removePersonFromGroupMutation.mutate,
    removePersonFromGroupAsync: removePersonFromGroupMutation.mutateAsync
  }
}