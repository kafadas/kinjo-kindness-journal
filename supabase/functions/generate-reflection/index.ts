import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  period: string;
  tz?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate reflection function called');
    
    // Parse request body
    const { period = '7d', tz = 'UTC' }: RequestBody = await req.json();
    console.log('Request params:', { period, tz });

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
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if we have an AI provider configured in settings
    let useAI = false;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (openaiKey) {
      // Check user settings for AI preference
      const { data: settings } = await supabaseClient
        .from('settings')
        .select('ai_provider')
        .eq('user_id', user.id)
        .maybeSingle();
      
      useAI = settings?.ai_provider === 'openai';
      console.log('AI settings:', { hasKey: !!openaiKey, aiProvider: settings?.ai_provider, useAI });
    }

    let reflection = null;

    if (useAI) {
      try {
        console.log('Attempting AI generation...');
        
        // Get user timezone and calculate date range using the new utility
        const { data: userTimezone } = await supabaseClient.rpc('get_user_timezone', { p_user: user.id });
        const timezone = userTimezone || 'UTC';
        
        // Use new getRange utility for consistent date calculations
        const dateRange = { start: new Date(), end: new Date(), period };
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        dateRange.end = new Date();
        dateRange.start = new Date(dateRange.end);
        dateRange.start.setDate(dateRange.start.getDate() - (days - 1));
        
        // Use moments_in_range helper for consistent timezone handling
        const { data: moments, error: momentsError } = await supabaseClient.rpc('moments_in_range', {
          p_user: user.id,
          p_start: dateRange.start.toISOString().split('T')[0],
          p_end: dateRange.end.toISOString().split('T')[0],  
          p_tz: timezone
        });

        if (momentsError) {
          console.error('Error fetching moments:', momentsError);
          throw momentsError;
        }

        // Get related data for context (categories)
        const momentIds = moments?.map(m => m.id) || [];
        const { data: categories } = momentIds.length > 0 ? await supabaseClient
          .from('categories')
          .select('id, name')
          .in('id', moments?.map(m => m.category_id).filter(Boolean) || []) : { data: [] };

        // Create category lookup
        const categoryLookup = categories?.reduce((acc, cat) => {
          acc[cat.id] = cat;
          return acc;
        }, {} as Record<string, any>) || {};

        // Add category info to moments
        const momentsWithCategories = moments?.map(m => ({
          ...m,
          category: m.category_id ? categoryLookup[m.category_id] : null
        })) || [];

        // Count assertion - verify our data matches what we'll display
        console.log(`AI reflection data: ${momentsWithCategories?.length || 0} moments for period ${period}`);
        
        if (!momentsWithCategories || momentsWithCategories.length === 0) {
          console.log('No moments found for AI reflection - falling back to rule-based');
          throw new Error('No moments for AI generation');
        }

        // Prepare anonymized context
        const context = {
          period,
          totalMoments: momentsWithCategories?.length || 0,
          givenCount: momentsWithCategories?.filter(m => m.action === 'given').length || 0,
          receivedCount: momentsWithCategories?.filter(m => m.action === 'received').length || 0,
          significantCount: momentsWithCategories?.filter(m => m.significance).length || 0,
          topCategory: momentsWithCategories?.reduce((acc, m) => {
            if (m.category?.name) {
              acc[m.category.name] = (acc[m.category.name] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>),
          activeDays: new Set(momentsWithCategories?.map(m => m.happened_at?.split('T')[0]) || []).size
        };

        // Get top category
        const topCategoryEntry = Object.entries(context.topCategory || {})
          .sort(([,a], [,b]) => b - a)[0];
        const topCategory = topCategoryEntry?.[0] || null;

        // Call OpenAI
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-mini-2025-08-07',
            max_completion_tokens: 300,
            messages: [
              {
                role: 'system',
                content: 'You are a gentle, supportive reflection assistant for a kindness journal app called Kinjo. Generate warm, human-first reflections that celebrate small acts of kindness without being gamified or competitive. Keep tone calm and encouraging. Respond with JSON: {"summary": "2-3 sentences", "suggestions": "1-2 gentle suggestions"}'
              },
              {
                role: 'user',
                content: `Create a ${period} reflection based on: ${context.totalMoments} moments (${context.givenCount} given, ${context.receivedCount} received), ${context.significantCount} significant moments, ${context.activeDays} active days${topCategory ? `, most activity in ${topCategory}` : ''}. Be supportive and human-first.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiResult = JSON.parse(aiData.choices[0].message.content);
          console.log('AI generation successful');
          
          // Use period_bounds with user's timezone for consistency
          const { data: bounds } = await supabaseClient.rpc('period_bounds', { p_period: period, p_tz: timezone });
          
          // Create reflection with AI content
          const { data: aiReflection, error: insertError } = await supabaseClient
            .from('reflections')
            .upsert({
              user_id: user.id,
              period,
              range_start: bounds?.[0]?.d_start,
              range_end: bounds?.[0]?.d_end,
              summary: aiResult.summary,
              suggestions: aiResult.suggestions,
              model: 'ai',
              computed: {
                given: context.givenCount,
                received: context.receivedCount,
                total: context.totalMoments,
                top_category: topCategory || '',
                period,
                activeDays: context.activeDays
              },
              regenerated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,period,range_start,range_end'
            })
            .select()
            .single();

          if (!insertError) {
            reflection = aiReflection;
          }
        }
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
        // Fall through to rule-based generation
      }
    }

    // Fall back to rule-based generation if AI failed or not configured
    if (!reflection) {
      console.log('Using rule-based generation via RPC...');
      
      const { data: rpcResult, error: rpcError } = await supabaseClient
        .rpc('get_or_generate_reflection', {
          p_period: period,
          p_tz: timezone || tz // Use detected timezone or fallback
        });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw rpcError;
      }

      reflection = rpcResult;
    }

    console.log('Reflection generated successfully:', { 
      id: reflection?.id, 
      model: reflection?.model,
      period: reflection?.period 
    });

    return new Response(JSON.stringify(reflection), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate reflection',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});