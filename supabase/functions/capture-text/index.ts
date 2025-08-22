import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CaptureRequest {
  text: string
  seedPerson?: string
  seedCategory?: string
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

    const { text, seedPerson, seedCategory } = requestBody

    console.log('Capture request:', { text, seedPerson, seedCategory, userId: user.id })

    // Basic text validation
    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For now, create a simple moment record
    // TODO: Implement AI parsing to extract person, action, category, etc.
    const momentData: {
      user_id: string;
      description: string;
      happened_at: string;
      action: 'given' | 'received';
      source: string;
      significance: boolean;
      tags: string[];
      category_id?: string;
      person_id?: string;
    } = {
      user_id: user.id,
      description: text.trim(),
      happened_at: new Date().toISOString(),
      action: 'given' as const, // Default action
      source: 'text' as const,
      significance: false,
      tags: []
    }

    // If seedCategory is provided, try to find the category
    if (seedCategory) {
      const { data: categories } = await supabaseClient
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('slug', seedCategory)
        .limit(1)

      if (categories && categories.length > 0) {
        momentData.category_id = categories[0].id
      }
    }

    // If seedPerson is provided, try to find or create the person
    if (seedPerson) {
      let personId: string | null = null

      // First, try to find existing person
      const { data: existingPeople } = await supabaseClient
        .from('people')
        .select('id')
        .eq('user_id', user.id)
        .ilike('display_name', `%${seedPerson}%`)
        .limit(1)

      if (existingPeople && existingPeople.length > 0) {
        personId = existingPeople[0].id
      } else {
        // Create new person
        const { data: newPerson } = await supabaseClient
          .from('people')
          .insert({
            user_id: user.id,
            display_name: seedPerson,
            avatar_type: 'initials'
          })
          .select('id')
          .single()

        if (newPerson) {
          personId = newPerson.id
        }
      }

      if (personId) {
        momentData.person_id = personId
      }
    }

    // Create the moment
    const { data: moment, error: insertError } = await supabaseClient
      .from('moments')
      .insert(momentData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating moment:', insertError)
      console.error('Moment data that failed:', momentData)
      return new Response(JSON.stringify({ 
        error: 'Failed to create moment', 
        details: insertError.message,
        code: insertError.code 
      }), {
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