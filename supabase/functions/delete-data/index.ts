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

    const { deleteType } = await req.json()

    console.log('Delete request:', { deleteType, userId: user.id })

    if (deleteType === 'moments') {
      // Delete only moments but keep user account and related data
      const { error: momentsError } = await supabaseClient
        .from('moments')
        .delete()
        .eq('user_id', user.id)

      if (momentsError) {
        console.error('Error deleting moments:', momentsError)
        return new Response(JSON.stringify({ error: 'Failed to delete moments' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Update people's last_recorded_moment_at to null
      await supabaseClient
        .from('people')
        .update({ last_recorded_moment_at: null })
        .eq('user_id', user.id)

      // Reset streak data
      await supabaseClient
        .from('streaks')
        .update({ current: 0, best: 0, last_entry_date: null })
        .eq('user_id', user.id)

      return new Response(JSON.stringify({
        success: true,
        message: 'All moments deleted successfully',
        deletedType: 'moments'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (deleteType === 'all') {
      // Delete all user data in proper order (respecting foreign keys)
      
      // 1. Delete attachments
      await supabaseClient.from('attachments').delete().eq('user_id', user.id)
      
      // 2. Delete moments
      await supabaseClient.from('moments').delete().eq('user_id', user.id)
      
      // 3. Delete person_groups relationships
      const { data: userPeople } = await supabaseClient
        .from('people')
        .select('id')
        .eq('user_id', user.id)
      
      if (userPeople && userPeople.length > 0) {
        const personIds = userPeople.map(p => p.id)
        await supabaseClient
          .from('person_groups')
          .delete()
          .in('person_id', personIds)
      }
      
      // 4. Delete people
      await supabaseClient.from('people').delete().eq('user_id', user.id)
      
      // 5. Delete groups
      await supabaseClient.from('groups').delete().eq('user_id', user.id)
      
      // 6. Delete categories
      await supabaseClient.from('categories').delete().eq('user_id', user.id)
      
      // 7. Delete nudges
      await supabaseClient.from('nudges').delete().eq('user_id', user.id)
      
      // 8. Delete reflections
      await supabaseClient.from('reflections').delete().eq('user_id', user.id)
      
      // 9. Delete streaks
      await supabaseClient.from('streaks').delete().eq('user_id', user.id)
      
      // 10. Delete settings
      await supabaseClient.from('settings').delete().eq('user_id', user.id)
      
      // 11. Delete profiles
      await supabaseClient.from('profiles').delete().eq('user_id', user.id)

      return new Response(JSON.stringify({
        success: true,
        message: 'All user data deleted successfully',
        deletedType: 'all'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else {
      return new Response(JSON.stringify({ error: 'Invalid delete type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Error in delete-data function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
