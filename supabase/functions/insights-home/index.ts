import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Parse query parameters
    const url = new URL(req.url)
    const range = url.searchParams.get('range') || 'last_30d'

    console.log('Insights request:', { range, userId: user.id })

    // Calculate date range
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

    // Get Life Balance (given/received by category)
    const { data: lifeBalance } = await supabaseClient
      .rpc('given_received_by_category', {
        _user: user.id,
        _from: from.toISOString(),
        _to: now.toISOString()
      })

    // Get Opportunities (people to reconnect with)
    const { data: opportunities } = await supabaseClient
      .rpc('opportunities_people', {
        _user: user.id,
        _from: from.toISOString(),
        _to: now.toISOString(),
        _limit: 5
      })

    // Get Highlights (significant moments)
    const { data: highlights } = await supabaseClient
      .rpc('significant_moments', {
        _user: user.id,
        _from: from.toISOString(),
        _to: now.toISOString()
      })

    // Get Current Streak
    const { data: streakData } = await supabaseClient
      .rpc('compute_streak', {
        _user: user.id
      })

    const streak = streakData?.[0] || { current: 0, best: 0, last_entry_date: null }

    // Calculate summary stats
    const totalGiven = lifeBalance?.reduce((sum: number, cat: any) => sum + cat.given_count, 0) || 0
    const totalReceived = lifeBalance?.reduce((sum: number, cat: any) => sum + cat.received_count, 0) || 0
    const totalMoments = totalGiven + totalReceived

    // Get unique people count
    const { count: uniquePeopleCount } = await supabaseClient
      .from('moments')
      .select('person_id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('happened_at', from.toISOString())
      .not('person_id', 'is', null)

    const recentShifts = [
      // TODO: Implement recent shifts calculation
      // This would compare current period vs previous period
      // Example: "25% more acts of kindness to family this week"
    ]

    const insights = {
      lifeBalance: lifeBalance || [],
      opportunities: opportunities || [],
      highlights: highlights || [],
      recentShifts,
      streak,
      summary: {
        totalMoments,
        totalGiven,
        totalReceived,
        uniquePeople: uniquePeopleCount || 0,
        range,
        fromDate: from.toISOString(),
        toDate: now.toISOString()
      }
    }

    console.log('Insights generated:', {
      lifeBalanceCount: insights.lifeBalance.length,
      opportunitiesCount: insights.opportunities.length,
      highlightsCount: insights.highlights.length,
      summary: insights.summary
    })

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in insights-home function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})