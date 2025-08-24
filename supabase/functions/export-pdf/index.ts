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

    console.log('PDF export request for user:', user.id)

    // Get user's moments for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: moments } = await supabaseClient
      .from('moments')
      .select(`
        *,
        person:people(display_name),
        category:categories(name)
      `)
      .eq('user_id', user.id)
      .gte('happened_at', thirtyDaysAgo.toISOString())
      .order('happened_at', { ascending: false })

    const { data: allMoments } = await supabaseClient
      .from('moments')
      .select('id')
      .eq('user_id', user.id)

    const totalMoments = allMoments?.length || 0
    const recentMoments = moments?.length || 0
    const givenCount = moments?.filter(m => m.action === 'given').length || 0
    const receivedCount = moments?.filter(m => m.action === 'received').length || 0

    // Generate simple PDF content (as HTML for now, would use PDF library in production)
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kinjo Data Export</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; margin: 40px; color: #374151; }
          .header { text-align: center; margin-bottom: 40px; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 40px 0; }
          .stat-card { padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .stat-number { font-size: 32px; font-weight: bold; color: #6366f1; }
          .timeline { margin-top: 40px; }
          .moment { padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
          .moment-date { font-size: 14px; color: #6b7280; }
          .moment-content { font-weight: 500; margin: 4px 0; }
          .moment-meta { font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Your Kinjo Journey</h1>
          <p>Export generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${totalMoments}</div>
            <div>Total Moments</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${recentMoments}</div>
            <div>Last 30 Days</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${givenCount}</div>
            <div>Given (Recent)</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${receivedCount}</div>
            <div>Received (Recent)</div>
          </div>
        </div>

        <div class="timeline">
          <h2>Recent Timeline</h2>
          ${moments?.slice(0, 20).map(moment => `
            <div class="moment">
              <div class="moment-date">${new Date(moment.happened_at).toLocaleDateString()}</div>
              <div class="moment-content">${moment.description || 'No description'}</div>
              <div class="moment-meta">
                ${moment.action} • ${moment.person?.display_name || 'Unknown'} • ${moment.category?.name || 'Uncategorized'}
              </div>
            </div>
          `).join('') || '<p>No recent moments found.</p>'}
        </div>
      </body>
      </html>
    `

    // In production, this would generate an actual PDF file and return a signed URL
    // For now, return the HTML content with metadata
    return new Response(JSON.stringify({
      message: 'PDF export generated successfully',
      format: 'pdf',
      recordCount: totalMoments,
      recentCount: recentMoments,
      content: pdfContent,
      // In production: signedUrl: 'https://storage.url/path-to-pdf'
      signedUrl: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in export-pdf function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})