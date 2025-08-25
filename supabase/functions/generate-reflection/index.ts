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

// Generate rule-based reflection with multiple templates and rich insights
function generateFallbackReflection(moments: any[], range: string, weeklyPatterns: any, streakData: any, microKindness: string) {
  const totalMoments = moments?.length || 0;
  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  
  // Multiple templates to avoid repetition
  const templates = [
    { variant: 'reflective', tone: 'contemplative' },
    { variant: 'encouraging', tone: 'supportive' },
    { variant: 'appreciative', tone: 'grateful' },
    { variant: 'forward-looking', tone: 'hopeful' }
  ];
  
  const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  let summary = '';
  let suggestions: string[] = [];

  if (totalMoments === 0) {
    const emptyTemplates = {
      reflective: `In the gentle rhythm of the last ${rangeDays} days, kindness took a quieter form. Sometimes the most important act is simply being present with ourselves.`,
      encouraging: `The last ${rangeDays} days offered space for reflection. Every quiet moment holds potential for the kindness that's yet to unfold.`,
      appreciative: `While the last ${rangeDays} days were peaceful on the kindness front, this pause itself can be a form of self-compassion.`,
      'forward-looking': `The last ${rangeDays} days created space for what's coming next. Tomorrow brings fresh opportunities to connect and care.`
    };
    
    summary = emptyTemplates[selectedTemplate.variant] || emptyTemplates.reflective;
    
    suggestions = [
      microKindness || "Consider starting small - perhaps a genuine smile, a heartfelt thank you, or reaching out to someone who matters to you.",
      "Remember that even the smallest gestures ripple outward in ways we can't always see."
    ];
  } else {
    // Rich analysis of patterns
    const categoryCount: Record<string, number> = {};
    const peopleCount: Record<string, number> = {};
    const peopleSet = new Set<string>();
    const daySet = new Set<string>();
    const weekdayCount: Record<number, number> = {};
    const actionCount = { given: 0, received: 0 };
    
    moments?.forEach(moment => {
      if (moment.category?.name) {
        categoryCount[moment.category.name] = (categoryCount[moment.category.name] || 0) + 1;
      }
      if (moment.person?.display_name) {
        peopleSet.add(moment.person.display_name);
        peopleCount[moment.person.display_name] = (peopleCount[moment.person.display_name] || 0) + 1;
      }
      if (moment.happened_at) {
        const date = new Date(moment.happened_at);
        daySet.add(moment.happened_at.split('T')[0]);
        const weekday = date.getDay();
        weekdayCount[weekday] = (weekdayCount[weekday] || 0) + 1;
      }
      if (moment.action) {
        actionCount[moment.action] = (actionCount[moment.action] || 0) + 1;
      }
    });

    const topCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'various areas';
    
    const topPerson = Object.entries(peopleCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
      
    const mostActiveWeekday = Object.entries(weekdayCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activeDay = mostActiveWeekday ? weekdayNames[parseInt(mostActiveWeekday)] : null;
    
    const uniquePeople = peopleSet.size;
    const uniqueDays = daySet.size;
    const currentStreak = streakData?.current || 0;

    // Build contextual summary with template variety
    const contextualSummaries = {
      reflective: `Over the past ${rangeDays} days, you've woven ${totalMoments} moments of kindness into your life${topCategory ? `, with your heart particularly drawn to ${topCategory}` : ''}. ${topPerson ? `Your connection with ${topPerson} seems to bloom naturally in these pages.` : ''} ${activeDay && weekdayCount[parseInt(mostActiveWeekday)] > 1 ? `${activeDay}s tend to bring out your generous spirit.` : ''}`,
      
      encouraging: `What a beautiful collection - ${totalMoments} kindness moments across ${rangeDays} days! ${topCategory ? `You've been especially nurturing in ${topCategory}, ` : ''}${uniquePeople > 0 ? `touching ${uniquePeople} ${uniquePeople === 1 ? 'life' : 'lives'} along the way.` : ' creating ripples of care.'} ${currentStreak > 1 ? `Your ${currentStreak}-day streak shows the consistency of your caring heart.` : ''}`,
      
      appreciative: `These ${totalMoments} moments tell a story of intentional kindness over ${rangeDays} days. ${topCategory ? `The way you show up in ${topCategory} is particularly meaningful. ` : ''}${topPerson ? `Your relationship with ${topPerson} seems to be a wellspring of mutual care. ` : ''}${activeDay ? `There's something special about how ${activeDay}s inspire your generosity.` : ''}`,
      
      'forward-looking': `Looking at these ${totalMoments} moments from the last ${rangeDays} days, there's a beautiful pattern emerging. ${topCategory ? `Your kindness in ${topCategory} is creating lasting impact. ` : ''}${uniqueDays > rangeDays / 2 ? `You've been consistently present across ${uniqueDays} different days, ` : ''}building a foundation for even more meaningful connections ahead.`
    };

    summary = contextualSummaries[selectedTemplate.variant] || contextualSummaries.reflective;

    // Generate varied suggestions
    const suggestionPools = {
      reconnection: [
        topPerson && peopleCount[topPerson] === 1 ? `Consider reaching out to ${topPerson} again - that connection sparked something beautiful.` : null,
        uniquePeople < 3 && totalMoments > 2 ? "Your kindness circle could grow - perhaps reconnect with someone from your past or reach out to a new acquaintance." : null,
        "Think about someone who might benefit from hearing from you this week."
      ].filter(Boolean),
      
      expansion: [
        Object.keys(categoryCount).length === 1 ? `You've found your rhythm in ${topCategory}. Consider exploring kindness in other areas like work, community, or self-care.` : null,
        activeDay ? `${activeDay}s seem to bring out your generous spirit. What if you tried spreading that energy across other days too?` : null,
        "Notice opportunities for small acts of kindness in unexpected moments."
      ].filter(Boolean),
      
      deepening: [
        currentStreak > 0 ? `Your streak of ${currentStreak} days shows beautiful consistency. Trust in this natural rhythm you've created.` : null,
        "The kindness you're showing is creating ripples you may never fully see - keep nurturing these connections.",
        microKindness || "Small, consistent acts often matter more than grand gestures."
      ].filter(Boolean),
      
      celebration: [
        uniqueDays > rangeDays * 0.6 ? "You've been remarkably consistent, showing up with kindness across most days. That takes intentionality." : null,
        totalMoments > 10 ? "The abundance of kindness you've captured shows a heart that's truly awake to life's generous possibilities." : null,
        "Take a moment to appreciate the person you're becoming through these acts of care."
      ].filter(Boolean)
    };

    // Select 2-3 suggestions from different pools
    const allSuggestions: string[] = [];
    Object.values(suggestionPools).forEach(pool => {
      if (pool.length > 0) {
        allSuggestions.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    });
    
    // Ensure we have at least 2 suggestions
    if (allSuggestions.length < 2) {
      allSuggestions.push("Continue following your heart's natural inclination toward kindness - it's creating beautiful moments.");
    }
    
    suggestions = allSuggestions.slice(0, 3);
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

    // Fetch additional data for rich insights
    let weeklyPatterns = null;
    let streakData = null;
    let microKindness = '';
    let previousReflections = [];
    let kindnessBalance = { given: 0, received: 0 };
    let activityHeatMap = [];
    let dailySparkline = [];

    try {
      // Get weekly patterns
      const { data: weeklyData } = await supabaseClient.rpc('weekly_patterns', {
        p_user: user.id,
        p_start: range_start,
        p_end: range_end,
        p_tz: userTimezone
      });
      weeklyPatterns = weeklyData;

      // Get streak data  
      const { data: streakResult } = await supabaseClient.rpc('compute_streak', {
        _user: user.id
      });
      streakData = streakResult?.[0];

      // Get random micro-kindness suggestion
      const { data: promptData } = await supabaseClient
        .from('prompts')
        .select('text')
        .eq('is_active', true)
        .order('weight')
        .limit(10);
      
      if (promptData && promptData.length > 0) {
        const randomPrompt = promptData[Math.floor(Math.random() * promptData.length)];
        microKindness = randomPrompt.text;
      }

      // Get previous reflections (last 3)
      const { data: prevReflections } = await supabaseClient
        .from('reflections')
        .select('summary, suggestions, range_start, range_end, created_at, source')
        .eq('user_id', user.id)
        .not('range_start', 'eq', range_start)
        .order('created_at', { ascending: false })
        .limit(3);
      
      previousReflections = prevReflections || [];

      // Calculate kindness balance (given vs received)
      moments.forEach(moment => {
        if (moment.action === 'given') kindnessBalance.given++;
        if (moment.action === 'received') kindnessBalance.received++;
      });

      // Generate 7-day activity heat map
      const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const heatMapDays = Math.min(7, rangeDays);
      
      for (let i = heatMapDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayMoments = moments.filter(m => 
          m.happened_at && m.happened_at.split('T')[0] === dateStr
        ).length;
        
        activityHeatMap.push({
          date: dateStr,
          count: dayMoments,
          intensity: dayMoments === 0 ? 0 : Math.min(4, Math.ceil(dayMoments / 2))
        });
      }

      // Generate daily sparkline data
      const sparklineDays = Math.min(rangeDays, 30); // Max 30 days for sparkline
      for (let i = sparklineDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayCount = moments.filter(m => 
          m.happened_at && m.happened_at.split('T')[0] === dateStr
        ).length;
        
        dailySparkline.push({ date: dateStr, count: dayCount });
      }

    } catch (error) {
      console.log('Error fetching additional data:', error);
      // Continue with defaults - don't fail
    }

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
    const { summary, suggestions } = aiResult || generateFallbackReflection(moments, range, weeklyPatterns, streakData, microKindness);
    
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
    return new Response(JSON.stringify({
      ...reflection,
      // Rich insights data
      kindnessBalance,
      activityHeatMap,
      dailySparkline,
      previousReflections,
      insights: {
        weeklyPatterns,
        streakData,
        microKindness: microKindness || null
      }
    }), {
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