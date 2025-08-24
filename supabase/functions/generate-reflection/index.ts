import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { range_start, range_end } = await req.json();

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
      throw new Error('Authentication required');
    }

    // Check if reflection already exists for this period
    const { data: existing } = await supabaseClient
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('range_start', range_start)
      .eq('range_end', range_end)
      .single();

    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get moments data for the period
    const { data: moments, error: momentsError } = await supabaseClient
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
      throw momentsError;
    }

    // Generate rule-based reflection
    const totalMoments = moments?.length || 0;
    
    let summary = '';
    let suggestions = '';

    if (totalMoments === 0) {
      summary = "This week was quiet on the kindness front. That's perfectly okay - sometimes we need to recharge.";
      suggestions = "Consider starting small tomorrow. Maybe a smile, a thank you, or reaching out to someone you care about.";
    } else {
      // Analyze categories
      const categoryCount: Record<string, number> = {};
      const peopleSet = new Set<string>();
      
      moments?.forEach(moment => {
        if (moment.category?.name) {
          categoryCount[moment.category.name] = (categoryCount[moment.category.name] || 0) + 1;
        }
        if (moment.person?.display_name) {
          peopleSet.add(moment.person.display_name);
        }
      });

      const topCategory = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'various areas';

      const uniquePeople = peopleSet.size;

      if (totalMoments === 1) {
        summary = `You captured one meaningful kindness moment this week. It's wonderful that you took time to acknowledge it.`;
      } else {
        summary = `You captured ${totalMoments} kindness moments this week${uniquePeople > 0 ? `, touching ${uniquePeople} ${uniquePeople === 1 ? 'person' : 'people'}` : ''}. Most of your kindness was in ${topCategory}.`;
      }

      // Generate suggestions based on patterns
      if (uniquePeople < 3 && totalMoments > 2) {
        suggestions = "You might enjoy expanding your kindness circle - perhaps reaching out to someone new or reconnecting with an old friend.";
      } else if (Object.keys(categoryCount).length === 1) {
        suggestions = "Consider exploring kindness in different areas of your life - maybe at work, in your community, or through self-care.";
      } else {
        suggestions = "You're creating beautiful moments across different parts of your life. Keep nurturing these connections.";
      }
    }

    // Insert reflection into database
    const { data: reflection, error: insertError } = await supabaseClient
      .from('reflections')
      .insert({
        user_id: user.id,
        range_start,
        range_end,
        summary,
        suggestions
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify(reflection), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating reflection:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});