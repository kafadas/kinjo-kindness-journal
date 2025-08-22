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
  console.log('=== Capture Text Function Called ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Debug all headers
    console.log('=== Request Headers ===')
    for (const [key, value] of req.headers.entries()) {
      // Don't log full authorization value for security, just first/last chars
      if (key.toLowerCase() === 'authorization') {
        const maskedValue = value.length > 10 ? 
          `${value.substring(0, 10)}...${value.substring(value.length - 10)}` : 
          'present'
        console.log(`${key}: ${maskedValue}`)
      } else {
        console.log(`${key}: ${value}`)
      }
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    const apikeyHeader = req.headers.get('apikey')
    
    console.log('Auth header present:', !!authHeader)
    console.log('Apikey header present:', !!apikeyHeader)

    if (!authHeader && !apikeyHeader) {
      console.error('No authorization or apikey header found')
      return new Response(JSON.stringify({ 
        error: 'Missing authorization header',
        code: 'MISSING_AUTH_HEADER'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with proper auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { 
            Authorization: authHeader || `Bearer ${apikeyHeader}`,
          },
        },
      }
    )

    console.log('=== Authentication Check ===')
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    console.log('Auth check completed')
    console.log('User present:', !!user)
    console.log('User ID:', user?.id || 'none')
    console.log('Auth error:', authError?.message || 'none')

    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError?.message || 'No user found',
        code: 'AUTH_FAILED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body with comprehensive debugging
    console.log('=== Request Body Processing ===')
    let requestBody: CaptureRequest
    try {
      const bodyText = await req.text()
      console.log('Raw body length:', bodyText?.length || 0)
      console.log('Raw body content:', bodyText || 'EMPTY')
      console.log('Body type:', typeof bodyText)
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('Request body is empty or null')
        return new Response(JSON.stringify({ 
          error: 'Request body is required',
          code: 'EMPTY_BODY'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      requestBody = JSON.parse(bodyText)
      console.log('Parsed request body:', requestBody)
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Parse error details:', parseError.message)
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message,
        code: 'JSON_PARSE_ERROR'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { text, seedPerson, seedCategory } = requestBody

    console.log('=== Input Validation ===')
    console.log('Extracted data:', { 
      text: text || 'MISSING', 
      seedPerson: seedPerson || 'none', 
      seedCategory: seedCategory || 'none',
      userId: user.id 
    })

    // Basic text validation
    if (!text || text.trim().length === 0) {
      console.error('Text validation failed - empty or missing text')
      return new Response(JSON.stringify({ 
        error: 'Text is required and cannot be empty',
        code: 'MISSING_TEXT'
      }), {
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
    console.log('=== Database Insertion ===')
    console.log('Final moment data:', JSON.stringify(momentData, null, 2))
    
    const { data: moment, error: insertError } = await supabaseClient
      .from('moments')
      .insert(momentData)
      .select()
      .single()

    if (insertError) {
      console.error('=== Database Insert Error ===')
      console.error('Error details:', insertError)
      console.error('Error message:', insertError.message)
      console.error('Error code:', insertError.code)
      console.error('Error hint:', insertError.hint)
      console.error('Failed moment data:', JSON.stringify(momentData, null, 2))
      
      return new Response(JSON.stringify({ 
        error: 'Database insertion failed', 
        details: insertError.message,
        hint: insertError.hint,
        code: insertError.code || 'DB_INSERT_ERROR'
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