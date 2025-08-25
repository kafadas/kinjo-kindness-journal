import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to calculate date range based on range parameter
function getDateRange(range: string, timezone: string = 'UTC') {
  const now = new Date();
  let days: number = 6; // default 7d means last 7 days (including today)
  
  switch (range) {
    case '30d':
      days = 29;
      break;
    case '90d':
      days = 89;
      break;
    case '7d':
    default:
      days = 6;
      break;
  }
  
  const endDate = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);
  
  // Format as YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
}

// Generate rule-based reflection (fallback)
function generateFallbackReflection(moments: any[], range: string) {
  const totalMoments = moments?.length || 0;
  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  
  let summary = '';
  let suggestions: string[] = [];

  if (totalMoments === 0) {
    summary = `The last ${rangeDays} days were quiet on the kindness front. That's perfectly okay - sometimes we need to recharge.`;
    suggestions = [
      "Consider starting small tomorrow. Maybe a smile, a thank you, or reaching out to someone you care about.",
      "Remember that even small acts count - holding a door, listening to a friend, or being patient with yourself."
    ];
  } else {
    // Analyze categories
    const categoryCount: Record<string, number> = {};
    const peopleSet = new Set<string>();
    const daySet = new Set<string>();
    
    moments?.forEach(moment => {
      if (moment.category?.name) {
        categoryCount[moment.category.name] = (categoryCount[moment.category.name] || 0) + 1;
      }
      if (moment.person?.display_name) {
        peopleSet.add(moment.person.display_name);
      }
      if (moment.happened_at) {
        daySet.add(moment.happened_at.split('T')[0]);
      }
    });

    const topCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'various areas';
    
    const uniquePeople = peopleSet.size;
    const uniqueDays = daySet.size;

    if (totalMoments === 1) {
      summary = `You captured one meaningful kindness moment in the last ${rangeDays} days. It's wonderful that you took time to acknowledge it.`;
    } else {
      summary = `You captured ${totalMoments} kindness moments in the last ${rangeDays} days${uniquePeople > 0 ? `, connecting with ${uniquePeople} ${uniquePeople === 1 ? 'person' : 'people'}` : ''}. Most of your kindness was in ${topCategory}.`;
    }

    // Generate suggestions based on patterns
    if (uniquePeople < 2 && totalMoments > 1) {
      suggestions.push("You might enjoy expanding your kindness circle - perhaps reaching out to someone new or reconnecting with an old friend.");
    }
    
    if (Object.keys(categoryCount).length === 1) {
      suggestions.push("Consider exploring kindness in different areas of your life - maybe at work, in your community, or through self-care.");
    }
    
    if (uniqueDays < Math.min(7, rangeDays / 4)) {
      suggestions.push("Try spreading your kindness moments across more days - even small daily acts can create meaningful patterns.");
    }
    
    if (suggestions.length === 0) {
      suggestions.push("You're creating beautiful moments across different parts of your life. Keep nurturing these connections.");
    }
  }

  return { summary, suggestions };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Always return 200 - never throw errors to client
  try {
    console.log('Generate reflection function called');
    
    // Parse request body safely
    let range = '7d'; // default
    try {
      const body = await req.json();
      range = body.range || '7d';
      console.log('Requested range:', range);
    } catch (parseError) {
      console.log('Using default range due to parse error:', parseError);
      // Continue with default range - don't fail
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        summary: 'Please log in to view your reflection.',
        suggestions: ['Sign in to see your personalized kindness insights.'],
        source: 'fallback'
      }), {
        status: 200, // Still return 200
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user timezone
    let userTimezone = 'UTC';
    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('timezone')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile?.timezone) {
        userTimezone = profile.timezone;
      }
    } catch (error) {
      console.log('Could not fetch user timezone, using UTC:', error);
    }

    // Calculate date range
    const { start: range_start, end: range_end } = getDateRange(range, userTimezone);
    console.log('Date range:', { range_start, range_end, timezone: userTimezone });

    // Try to get existing reflection first
    let existingReflection = null;
    try {
      const { data: existing } = await supabaseClient
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .eq('range_start', range_start)
        .eq('range_end', range_end)
        .maybeSingle();

      if (existing) {
        console.log('Found existing reflection');
        // Add source field if missing
        const result = {
          ...existing,
          source: existing.source || 'fallback'
        };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.log('Error checking existing reflection:', error);
      // Continue to generate new one
    }

    // Get moments data for the period
    let moments = [];
    try {
      const { data: momentsData, error: momentsError } = await supabaseClient
        .from('moments')
        .select(`
          *,
          person:people(display_name),
          category:categories(name)
        `)
        .eq('user_id', user.id)
        .gte('happened_at', range_start + 'T00:00:00Z')
        .lte('happened_at', range_end + 'T23:59:59Z')
        .order('happened_at', { ascending: false });

      if (momentsError) {
        console.error('Error fetching moments:', momentsError);
      } else {
        moments = momentsData || [];
      }
    } catch (error) {
      console.error('Error querying moments:', error);
      // Continue with empty moments array
    }

    console.log(`Found ${moments.length} moments for reflection`);

    // Try AI path if API key exists
    let source = 'fallback';
    let aiResult = null;
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (openaiKey && moments.length > 0) {
      try {
        console.log('Attempting AI generation...');
        // TODO: Implement AI generation here when needed
        // For now, skip AI and use fallback
        console.log('AI path not implemented yet, using fallback');
      } catch (aiError) {
        console.log('AI generation failed, using fallback:', aiError);
      }
    } else {
      console.log('No AI key or no moments, using fallback');
    }

    // Generate rule-based reflection (always works)
    const { summary, suggestions } = aiResult || generateFallbackReflection(moments, range);
    
    // Convert suggestions array to string if needed
    const suggestionsText = Array.isArray(suggestions) ? suggestions.join(' ') : suggestions;

    // Upsert reflection into database
    let reflection = null;
    try {
      const { data: upsertData, error: upsertError } = await supabaseClient
        .from('reflections')
        .upsert({
          user_id: user.id,
          range_start,
          range_end,
          summary,
          suggestions: suggestionsText
        }, {
          onConflict: 'user_id,range_start,range_end'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error upserting reflection:', upsertError);
        // Return data even if DB save failed
        reflection = {
          user_id: user.id,
          range_start,
          range_end,
          summary,
          suggestions: suggestionsText,
          source
        };
      } else {
        reflection = { ...upsertData, source };
      }
    } catch (error) {
      console.error('Database upsert failed:', error);
      // Return data even if DB save failed
      reflection = {
        user_id: user.id,
        range_start,
        range_end,
        summary,
        suggestions: suggestionsText,
        source
      };
    }

    console.log('Reflection generated successfully');
    return new Response(JSON.stringify(reflection), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in reflection function:', error);
    
    // Even on unexpected errors, return 200 with fallback content
    const fallbackResponse = {
      summary: 'We encountered an issue generating your reflection, but that\'s okay. Every day is a new opportunity for kindness.',
      suggestions: 'Take a moment to appreciate the small acts of kindness in your life, both given and received.',
      source: 'fallback',
      range_start: new Date().toISOString().split('T')[0],
      range_end: new Date().toISOString().split('T')[0]
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});