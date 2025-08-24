import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CaptureRequest {
  text: string
  seedPersonId?: string
  seedCategoryId?: string
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
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body with better error handling
    let requestBody: CaptureRequest
    try {
      const bodyText = await req.text()
      console.log('Raw request body:', bodyText)
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty')
      }
      
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { text, seedPersonId, seedCategoryId } = requestBody

    console.log('Capture request:', { text, seedPersonId, seedCategoryId, userId: user.id })

    // Basic text validation
    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user settings for defaults
    const { data: userSettings } = await supabaseClient
      .from('settings')
      .select('default_category_id')
      .eq('user_id', user.id)
      .single()

    // Get "Other" category as fallback
    const { data: otherCategory } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('slug', 'other')
      .single()

    // Create moment with intelligent defaults
    const momentData = {
      user_id: user.id,
      description: text.trim(),
      happened_at: new Date().toISOString(),
      action: 'given' as const, // Default action
      source: 'text' as const,
      significance: false,
      tags: [],
      category_id: seedCategoryId || userSettings?.default_category_id || otherCategory?.id || null,
      person_id: seedPersonId || null
    }

    // Create the moment
    const { data: moment, error: insertError } = await supabaseClient
      .from('moments')
      .insert(momentData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating moment:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create moment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Moment created:', moment)

    // TODO: Enqueue AI parsing job here
    // This would typically:
    // 1. Pseudonymize names before sending to AI
    // 2. Send to AI service for parsing
    // 3. Update the moment with parsed data
    // 4. Create/update person and category records as needed

    return new Response(JSON.stringify({ 
      success: true, 
      moment,
      message: 'Moment captured successfully. AI parsing will be implemented next.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in capture-text function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})