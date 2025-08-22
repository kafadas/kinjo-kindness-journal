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

    // Parse query parameters
    const url = new URL(req.url)
    const format = url.searchParams.get('format') || 'csv'
    const range = url.searchParams.get('range') || 'all'

    console.log('Export request:', { format, range, userId: user.id })

    // Calculate date range if specified
    let whereClause = `user_id.eq.${user.id}`
    
    if (range !== 'all') {
      const now = new Date()
      let from: Date

      switch (range) {
        case 'last_7d':
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'last_30d':
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'last_90d':
          from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'last_year':
          from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      whereClause += `.and(happened_at.gte.${from.toISOString()})`
    }

    // Get moments with related data
    const { data: moments } = await supabaseClient
      .from('moments')
      .select(`
        *,
        person:people(display_name),
        category:categories(name)
      `)
      .eq('user_id', user.id)
      .order('happened_at', { ascending: false })

    if (!moments) {
      return new Response(JSON.stringify({ error: 'No data found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Exporting ${moments.length} moments in ${format} format`)

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Person',
        'Category',
        'Action',
        'Description',
        'Significant',
        'Source',
        'Tags'
      ]

      const csvRows = [
        headers.join(','),
        ...moments.map(moment => [
          new Date(moment.happened_at).toLocaleDateString(),
          moment.person?.display_name || '',
          moment.category?.name || '',
          moment.action,
          `"${(moment.description || '').replace(/"/g, '""')}"`,
          moment.significance ? 'Yes' : 'No',
          moment.source || '',
          `"${(moment.tags || []).join(', ')}"`
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="kinjo-export-${new Date().toISOString().split('T')[0]}.csv"`
        },
      })

    } else if (format === 'pdf') {
      // TODO: Implement PDF generation
      // This would typically use a PDF library to generate a formatted report
      
      return new Response(JSON.stringify({ 
        message: 'PDF export not yet implemented. A signed URL would be returned here.',
        signedUrl: null,
        format: 'pdf',
        recordCount: moments.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else {
      // Return JSON format
      return new Response(JSON.stringify({
        format: 'json',
        recordCount: moments.length,
        exportedAt: new Date().toISOString(),
        data: moments
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Error in export-data function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})