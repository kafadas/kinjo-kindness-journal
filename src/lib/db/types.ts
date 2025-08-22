import type { Database } from '@/integrations/supabase/types'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Core types
export type Profile = Tables<'profiles'>
export type Category = Tables<'categories'>
export type Group = Tables<'groups'>
export type Person = Tables<'people'>
export type Moment = Tables<'moments'>
export type Attachment = Tables<'attachments'>
export type Streak = Tables<'streaks'>
export type Settings = Tables<'settings'>
export type Prompt = Tables<'prompts'>
export type Reflection = Tables<'reflections'>
export type Nudge = Tables<'nudges'>

// Insert types
export type CreateMoment = Inserts<'moments'>
export type CreatePerson = Inserts<'people'>
export type CreateCategory = Inserts<'categories'>
export type CreateGroup = Inserts<'groups'>

// Update types
export type UpdateProfile = Updates<'profiles'>
export type UpdateSettings = Updates<'settings'>
export type UpdateMoment = Updates<'moments'>

// Composite types
export type MomentWithRelations = Moment & {
  person?: Person
  category?: Category
}

export type PersonWithGroups = Person & {
  groups?: Group[]
}

export type CategoryStats = {
  category_id: string
  category_name: string
  given_count: number
  received_count: number
}

export type OpportunityPerson = {
  person_id: string
  display_name: string
  last_recorded: string | null
  days_since: number
}

export type SignificantMoment = {
  moment_id: string
  happened_at: string
  description: string | null
  person_id: string | null
  category_id: string | null
}

export type StreakData = {
  current: number
  best: number
  last_entry_date: string | null
}

// Insight types
export interface HomeInsights {
  lifeBalance: CategoryStats[]
  opportunities: OpportunityPerson[]
  highlights: SignificantMoment[]
  recentShifts: any[] // TODO: define based on requirements
  streak: StreakData
}

// Enums
export type ActionType = 'given' | 'received'
export type CaptureMode = 'text' | 'voice'
export type AvatarType = 'initials' | 'emoji' | 'photo'
export type NudgeType = 'person_gap' | 'category_gap' | 'streak'