import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Nudge {
  id: string
  type: 'person_gap' | 'category_gap' | 'streak'
  entity_id?: string
  entity_name?: string
  message: string
  priority: number
  last_shown_at?: string
  cooldown_hours: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Nudges request for user:', user.id)

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const nudges: Nudge[] = []

    // 1. Person Gap Nudges - People not contacted recently
    const { data: staleRelationships } = await supabaseClient
      .rpc('opportunities_people', {
        _user: user.id,
        _from: sevenDaysAgo.toISOString(),
        _to: now.toISOString(),
        _limit: 3
      })

    if (staleRelationships) {
      for (const person of staleRelationships) {
        if (person.days_since > 7) { // Haven't contacted in over a week
          nudges.push({
            id: `person_gap_${person.person_id}`,
            type: 'person_gap',
            entity_id: person.person_id,
            entity_name: person.display_name,
            message: `It's been ${person.days_since} days since you connected with ${person.display_name}. Consider reaching out!`,
            priority: Math.min(person.days_since, 30), // Higher priority for longer gaps, capped at 30
            cooldown_hours: 48
          })
        }
      }
    }

    // 2. Category Gap Nudges - Underrepresented categories
    const { data: categoryBalance } = await supabaseClient
      .rpc('given_received_by_category', {
        _user: user.id,
        _from: sevenDaysAgo.toISOString(),
        _to: now.toISOString()
      })

    // Get all user categories
    const { data: allCategories } = await supabaseClient
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .order('sort_order')

    if (allCategories && categoryBalance) {
      const activeCategoryIds = new Set(categoryBalance.map(cat => cat.category_id))
      
      // Find categories with no activity
      const inactiveCategories = allCategories.filter(cat => !activeCategoryIds.has(cat.id))
      
      for (const category of inactiveCategories.slice(0, 2)) { // Limit to 2 category nudges
        nudges.push({
          id: `category_gap_${category.id}`,
          type: 'category_gap',
          entity_id: category.id,
          entity_name: category.name,
          message: `You haven't logged any moments for ${category.name} recently. Any kindness to share?`,
          priority: 15,
          cooldown_hours: 72
        })
      }
    }

    // 3. Streak Nudges - Encourage daily logging
    const { data: streakData } = await supabaseClient
      .rpc('compute_streak', {
        _user: user.id
      })

    const streak = streakData?.[0] || { current: 0, best: 0, last_entry_date: null }
    const lastEntryDate = streak.last_entry_date ? new Date(streak.last_entry_date) : null
    const daysSinceLastEntry = lastEntryDate ? 
      Math.floor((now.getTime() - lastEntryDate.getTime()) / (24 * 60 * 60 * 1000)) : 
      999

    if (daysSinceLastEntry > 1) {
      let message = ''
      let priority = 0

      if (streak.current >= 7 && daysSinceLastEntry === 2) {
        message = `Your ${streak.current}-day streak is at risk! Log a moment today to keep it going.`
        priority = 25
      } else if (daysSinceLastEntry >= 2) {
        message = `Haven't seen you in ${daysSinceLastEntry} days. Even small acts of kindness count!`
        priority = 10
      }

      if (message) {
        nudges.push({
          id: 'streak_reminder',
          type: 'streak',
          message,
          priority,
          cooldown_hours: 24
        })
      }
    }

    // 4. Check existing nudges to respect cooldowns
    const { data: existingNudges } = await supabaseClient
      .from('nudges')
      .select('*')
      .eq('user_id', user.id)

    // Filter out nudges that are in cooldown
    const availableNudges = nudges.filter(nudge => {
      const existing = existingNudges?.find(en => 
        en.nudge_type === nudge.type && 
        (nudge.entity_id ? en.entity_id === nudge.entity_id : true)
      )

      if (!existing || !existing.last_shown_at) return true

      const lastShown = new Date(existing.last_shown_at)
      const cooldownEnd = new Date(lastShown.getTime() + nudge.cooldown_hours * 60 * 60 * 1000)
      
      return now > cooldownEnd
    })

    // Sort by priority (higher number = higher priority)
    availableNudges.sort((a, b) => b.priority - a.priority)

    // Return top 3 nudges
    const topNudges = availableNudges.slice(0, 3)

    console.log(`Generated ${nudges.length} total nudges, ${availableNudges.length} available after cooldown, returning top ${topNudges.length}`)

    return new Response(JSON.stringify({
      nudges: topNudges,
      stats: {
        totalGenerated: nudges.length,
        availableAfterCooldown: availableNudges.length,
        returned: topNudges.length,
        streak: streak.current,
        daysSinceLastEntry
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in nudges function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})