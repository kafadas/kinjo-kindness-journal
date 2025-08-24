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
    // Get Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get regular client for user verification
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

    console.log('Account deletion request for user:', user.id)

    // First, delete all user data using the delete-data function logic
    // This ensures proper FK constraint handling
    
    // 1. Delete attachments
    await supabaseAdmin.from('attachments').delete().eq('user_id', user.id)
    
    // 2. Delete moments
    await supabaseAdmin.from('moments').delete().eq('user_id', user.id)
    
    // 3. Delete person_groups relationships
    const { data: userPeople } = await supabaseAdmin
      .from('people')
      .select('id')
      .eq('user_id', user.id)
    
    if (userPeople && userPeople.length > 0) {
      const personIds = userPeople.map(p => p.id)
      await supabaseAdmin
        .from('person_groups')
        .delete()
        .in('person_id', personIds)
    }
    
    // 4. Delete people
    await supabaseAdmin.from('people').delete().eq('user_id', user.id)
    
    // 5. Delete groups
    await supabaseAdmin.from('groups').delete().eq('user_id', user.id)
    
    // 6. Delete categories
    await supabaseAdmin.from('categories').delete().eq('user_id', user.id)
    
    // 7. Delete nudges
    await supabaseAdmin.from('nudges').delete().eq('user_id', user.id)
    
    // 8. Delete reflections
    await supabaseAdmin.from('reflections').delete().eq('user_id', user.id)
    
    // 9. Delete streaks
    await supabaseAdmin.from('streaks').delete().eq('user_id', user.id)
    
    // 10. Delete settings
    await supabaseAdmin.from('settings').delete().eq('user_id', user.id)
    
    // 11. Delete profiles
    await supabaseAdmin.from('profiles').delete().eq('user_id', user.id)

    // Finally, delete the auth user account
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Error deleting user account:', deleteError)
      return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Account successfully deleted for user:', user.id)

    return new Response(JSON.stringify({
      success: true,
      message: 'Account and all data deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in delete-account function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})