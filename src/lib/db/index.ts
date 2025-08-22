import { supabase } from '../supabase'
import type {
  Profile,
  Category,
  Person,
  Moment,
  Settings,
  CreateMoment,
  CreatePerson,
  CreateCategory,
  UpdateProfile,
  UpdateSettings,
  MomentWithRelations,
  CategoryStats,
  OpportunityPerson,
  SignificantMoment,
  StreakData,
  HomeInsights
} from './types'

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getCurrentUserId = async () => {
  const user = await getCurrentUser()
  return user?.id
}

// Profiles
export const getProfile = async (userId?: string) => {
  const uid = userId || await getCurrentUserId()
  if (!uid) throw new Error('No user ID provided')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', uid)
    .single()

  if (error) throw error
  return data as Profile
}

export const updateProfile = async (updates: UpdateProfile) => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

// Settings
export const getSettings = async () => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data as Settings
}

export const updateSettings = async (updates: UpdateSettings) => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Settings
}

// Categories
export const getCategories = async () => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')

  if (error) throw error
  return data as Category[]
}

export const createCategory = async (category: CreateCategory) => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...category, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

// People
export const getPeople = async () => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('user_id', userId)
    .order('display_name')

  if (error) throw error
  return data as Person[]
}

export const createPerson = async (person: CreatePerson) => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('people')
    .insert({ ...person, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as Person
}

// Moments
export const getMoments = async (limit = 50) => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('moments')
    .select(`
      *,
      person:people(*),
      category:categories(*)
    `)
    .eq('user_id', userId)
    .order('happened_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as MomentWithRelations[]
}

export const createMoment = async (moment: CreateMoment) => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('moments')
    .insert({ ...moment, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as Moment
}

// Insight functions
export const getLifeBalance = async (from: Date, to: Date): Promise<CategoryStats[]> => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .rpc('given_received_by_category', {
      _user: userId,
      _from: from.toISOString(),
      _to: to.toISOString()
    })

  if (error) throw error
  return data || []
}

export const getOpportunities = async (from: Date, to: Date, limit = 5): Promise<OpportunityPerson[]> => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .rpc('opportunities_people', {
      _user: userId,
      _from: from.toISOString(),
      _to: to.toISOString(),
      _limit: limit
    })

  if (error) throw error
  return data || []
}

export const getHighlights = async (from: Date, to: Date): Promise<SignificantMoment[]> => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .rpc('significant_moments', {
      _user: userId,
      _from: from.toISOString(),
      _to: to.toISOString()
    })

  if (error) throw error
  return data || []
}

export const getStreak = async (): Promise<StreakData> => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .rpc('compute_streak', {
      _user: userId
    })

  if (error) throw error
  return data?.[0] || { current: 0, best: 0, last_entry_date: null }
}

export const getHomeInsights = async (range = 'last_30d'): Promise<HomeInsights> => {
  const now = new Date()
  let from: Date

  switch (range) {
    case 'last_7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'last_30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'last_90d':
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  const [lifeBalance, opportunities, highlights, streak] = await Promise.all([
    getLifeBalance(from, now),
    getOpportunities(from, now),
    getHighlights(from, now),
    getStreak()
  ])

  return {
    lifeBalance,
    opportunities,
    highlights,
    recentShifts: [], // TODO: implement when requirements are clear
    streak
  }
}

// Nudges
export const getNudges = async () => {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('nudges')
    .select('*')
    .eq('user_id', userId)
    .is('snoozed_until', null)

  if (error) throw error
  return data
}