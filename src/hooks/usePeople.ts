import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPeople, createPerson as dbCreatePerson } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Person, CreatePerson } from '@/lib/db/types'

export const usePeople = () => {
  const queryClient = useQueryClient()

  const { data: people = [], isLoading, error } = useQuery({
    queryKey: ['people'],
    queryFn: () => getPeople()
  })

  const createPersonMutation = useMutation({
    mutationFn: (person: CreatePerson) => dbCreatePerson(person),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      toast.success('Person added successfully')
    },
    onError: (error) => {
      toast.error('Failed to add person: ' + error.message)
    }
  })

  const mergePersonMutation = useMutation({
    mutationFn: async ({ fromPersonId, toPersonId }: { fromPersonId: string, toPersonId: string }) => {
      // Update the person to mark as merged
      const { error: mergeError } = await supabase
        .from('people')
        .update({ merged_into: toPersonId })
        .eq('id', fromPersonId)

      if (mergeError) throw mergeError

      // Update all moments to point to the target person
      const { error: momentsError } = await supabase
        .from('moments')
        .update({ person_id: toPersonId })
        .eq('person_id', fromPersonId)

      if (momentsError) throw momentsError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['moments'] })
      toast.success('People merged successfully')
    },
    onError: (error) => {
      toast.error('Failed to merge people: ' + error.message)
    }
  })

  const searchPeople = (searchTerm: string) => {
    if (!searchTerm.trim()) return people
    
    return people.filter(person => 
      person.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.aliases?.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  return {
    people,
    isLoading,
    error,
    createPerson: createPersonMutation.mutate,
    isCreating: createPersonMutation.isPending,
    mergePerson: mergePersonMutation.mutate,
    isMerging: mergePersonMutation.isPending,
    searchPeople
  }
}

export const usePersonDetails = (personId: string) => {
  const { data: person, isLoading: isLoadingPerson } = useQuery({
    queryKey: ['person', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .single()

      if (error) throw error
      return data as Person
    },
    enabled: !!personId
  })

  const { data: moments = [], isLoading: isLoadingMoments } = useQuery({
    queryKey: ['person-moments', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moments')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('person_id', personId)
        .order('happened_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data
    },
    enabled: !!personId
  })

  const { data: stats } = useQuery({
    queryKey: ['person-stats', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moments')
        .select('action')
        .eq('person_id', personId)

      if (error) throw error

      const given = data.filter(m => m.action === 'given').length
      const received = data.filter(m => m.action === 'received').length

      return { given, received, total: given + received }
    },
    enabled: !!personId
  })

  return {
    person,
    moments,
    stats,
    isLoading: isLoadingPerson || isLoadingMoments
  }
}