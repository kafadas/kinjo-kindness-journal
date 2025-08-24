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

    // Get all user data for comprehensive export
    const [
      { data: moments },
      { data: people },
      { data: categories },
      { data: groups },
      { data: personGroups }
    ] = await Promise.all([
      supabaseClient
        .from('moments')
        .select(`
          *,
          person:people(display_name),
          category:categories(name)
        `)
        .eq('user_id', user.id)
        .order('happened_at', { ascending: false }),
      supabaseClient
        .from('people')
        .select('*')
        .eq('user_id', user.id)
        .order('display_name'),
      supabaseClient
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order'),
      supabaseClient
        .from('groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name'),
      supabaseClient
        .from('person_groups')
        .select(`
          *,
          person:people!inner(user_id)
        `)
        .eq('person.user_id', user.id)
    ])

    const totalRecords = (moments?.length || 0) + (people?.length || 0) + (categories?.length || 0) + (groups?.length || 0)
    
    if (totalRecords === 0) {
      return new Response(JSON.stringify({ error: 'No data found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Exporting ${totalRecords} total records in ${format} format`)

    if (format === 'csv') {
      // Helper function to escape CSV values
      const escapeCSV = (value: any) => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      // Generate multiple CSV files
      const csvFiles: { name: string; content: string }[] = []

      // Moments CSV
      if (moments && moments.length > 0) {
        const momentsHeaders = [
          'ID',
          'Date',
          'Person',
          'Category', 
          'Action',
          'Description',
          'Significant',
          'Source',
          'Tags'
        ]
        
        const momentsRows = [
          momentsHeaders.join(','),
          ...moments.map(moment => [
            escapeCSV(moment.id),
            escapeCSV(new Date(moment.happened_at).toISOString()),
            escapeCSV(moment.person?.display_name || ''),
            escapeCSV(moment.category?.name || ''),
            escapeCSV(moment.action),
            escapeCSV(moment.description || ''),
            escapeCSV(moment.significance ? 'Yes' : 'No'),
            escapeCSV(moment.source || ''),
            escapeCSV((moment.tags || []).join('; '))
          ].join(','))
        ]
        
        csvFiles.push({
          name: 'moments.csv',
          content: momentsRows.join('\n')
        })
      }

      // People CSV
      if (people && people.length > 0) {
        const peopleHeaders = ['ID', 'Display Name', 'Avatar Type', 'Avatar Value', 'Aliases', 'Created At', 'Last Recorded']
        const peopleRows = [
          peopleHeaders.join(','),
          ...people.map(person => [
            escapeCSV(person.id),
            escapeCSV(person.display_name),
            escapeCSV(person.avatar_type || ''),
            escapeCSV(person.avatar_value || ''),
            escapeCSV((person.aliases || []).join('; ')),
            escapeCSV(person.created_at),
            escapeCSV(person.last_recorded_moment_at || '')
          ].join(','))
        ]
        
        csvFiles.push({
          name: 'people.csv',
          content: peopleRows.join('\n')
        })
      }

      // Categories CSV
      if (categories && categories.length > 0) {
        const categoriesHeaders = ['ID', 'Name', 'Slug', 'Sort Order', 'Is Default', 'Created At']
        const categoriesRows = [
          categoriesHeaders.join(','),
          ...categories.map(category => [
            escapeCSV(category.id),
            escapeCSV(category.name),
            escapeCSV(category.slug),
            escapeCSV(category.sort_order || 0),
            escapeCSV(category.is_default ? 'Yes' : 'No'),
            escapeCSV(category.created_at)
          ].join(','))
        ]
        
        csvFiles.push({
          name: 'categories.csv',
          content: categoriesRows.join('\n')
        })
      }

      // Groups CSV
      if (groups && groups.length > 0) {
        const groupsHeaders = ['ID', 'Name', 'Emoji', 'Sort Order', 'Created At']
        const groupsRows = [
          groupsHeaders.join(','),
          ...groups.map(group => [
            escapeCSV(group.id),
            escapeCSV(group.name),
            escapeCSV(group.emoji || ''),
            escapeCSV(group.sort_order || 0),
            escapeCSV(group.created_at)
          ].join(','))
        ]
        
        csvFiles.push({
          name: 'groups.csv',
          content: groupsRows.join('\n')
        })
      }

      // Person Groups CSV
      if (personGroups && personGroups.length > 0) {
        const personGroupsHeaders = ['Person ID', 'Group ID']
        const personGroupsRows = [
          personGroupsHeaders.join(','),
          ...personGroups.map(pg => [
            escapeCSV(pg.person_id),
            escapeCSV(pg.group_id)
          ].join(','))
        ]
        
        csvFiles.push({
          name: 'person_groups.csv',
          content: personGroupsRows.join('\n')
        })
      }

      // For single CSV, return the largest file (usually moments)
      // In production, this would create a ZIP file with all CSVs
      const mainFile = csvFiles.find(f => f.name === 'moments.csv') || csvFiles[0]
    
      return new Response(mainFile.content, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="kinjo-export-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Total-Files': csvFiles.length.toString(),
          'X-File-List': csvFiles.map(f => f.name).join(',')
        },
      })

    } else if (format === 'pdf') {
      // TODO: Implement PDF generation
      // This would typically use a PDF library to generate a formatted report
      
      return new Response(JSON.stringify({ 
        message: 'PDF export not yet implemented. Use the export-pdf function instead.',
        signedUrl: null,
        format: 'pdf',
        recordCount: moments?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else {
      // Return JSON format with all data
      return new Response(JSON.stringify({
        format: 'json',
        recordCount: totalRecords,
        exportedAt: new Date().toISOString(),
        data: {
          moments: moments || [],
          people: people || [],
          categories: categories || [],
          groups: groups || [],
          personGroups: personGroups || []
        }
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