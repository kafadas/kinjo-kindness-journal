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
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')
    const summary = url.searchParams.get('summary') === '1'

    console.log('PDF export request for user:', user.id, { startDate, endDate, summary })

    // Set date range (default to current year if not specified)
    let fromDate: Date, toDate: Date
    
    if (startDate && endDate) {
      fromDate = new Date(startDate)
      toDate = new Date(endDate)
    } else {
      // Default to current year
      const now = new Date()
      fromDate = new Date(now.getFullYear(), 0, 1) // Jan 1st
      toDate = new Date(now.getFullYear(), 11, 31) // Dec 31st
    }

    // Get user profile and moments for the specified period
    const [
      { data: profile },
      { data: moments },
      { data: allMoments },
      { data: reflection }
    ] = await Promise.all([
      supabaseClient.from('profiles').select('display_name').eq('user_id', user.id).single(),
      supabaseClient
        .from('moments')
        .select(`
          *,
          person:people(display_name),
          category:categories(name)
        `)
        .eq('user_id', user.id)
        .gte('happened_at', fromDate.toISOString())
        .lte('happened_at', toDate.toISOString())
        .order('happened_at', { ascending: false }),
      supabaseClient
        .from('moments')
        .select('id')
        .eq('user_id', user.id),
      summary ? supabaseClient
        .from('reflections')
        .select('summary, suggestions')
        .eq('user_id', user.id)
        .eq('period', '365d')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() : Promise.resolve({ data: null })
    ])

    const totalMoments = allMoments?.length || 0
    const periodMoments = moments?.length || 0
    const givenCount = moments?.filter(m => m.action === 'given').length || 0
    const receivedCount = moments?.filter(m => m.action === 'received').length || 0

    // Calculate top categories and people
    const categoryStats = moments?.reduce((acc, m) => {
      const cat = m.category?.name || 'Other'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const peopleStats = moments?.reduce((acc, m) => {
      const person = m.person?.display_name || 'Unknown'
      acc[person] = (acc[person] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    const topPeople = Object.entries(peopleStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Calculate best streak (simple version)
    const activeDays = new Set(moments?.map(m => m.happened_at.split('T')[0]) || [])
    const bestStreak = activeDays.size // Simplified for demo

    const year = fromDate.getFullYear()
    const displayName = profile?.display_name || user.email || 'Kind Soul'

    // Generate mini calendar for active days
    const monthsInYear = []
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0)
      const activeDaysInMonth = moments?.filter(m => {
        const momentDate = new Date(m.happened_at)
        return momentDate.getMonth() === month && momentDate.getFullYear() === year
      }).map(m => new Date(m.happened_at).getDate()) || []
      
      monthsInYear.push({
        name: monthStart.toLocaleDateString('en-US', { month: 'long' }),
        activeDays: [...new Set(activeDaysInMonth)].sort((a, b) => a - b)
      })
    }

    // Generate PDF content (HTML for now, would use PDF library in production)
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kinjo ${year} Yearly Summary</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; margin: 40px; color: #374151; line-height: 1.6; }
          .cover { text-align: center; margin-bottom: 60px; padding: 60px 0; border-bottom: 2px solid #e5e7eb; }
          .cover h1 { font-size: 48px; font-weight: bold; color: #6366f1; margin-bottom: 16px; }
          .cover h2 { font-size: 24px; color: #6b7280; margin-bottom: 8px; }
          .cover p { font-size: 18px; color: #9ca3af; }
          
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 40px 0; }
          .stat-card { padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; text-align: center; }
          .stat-number { font-size: 36px; font-weight: bold; color: #6366f1; margin-bottom: 8px; }
          .stat-label { font-size: 14px; color: #6b7280; font-weight: 500; }
          
          .section { margin: 40px 0; }
          .section h3 { font-size: 24px; color: #374151; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          
          .top-lists { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 40px 0; }
          .top-list { }
          .top-list h4 { font-size: 18px; color: #6b7280; margin-bottom: 16px; }
          .top-item { display: flex; justify-content: between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .top-item:last-child { border-bottom: none; }
          .item-name { flex: 1; }
          .item-count { color: #6366f1; font-weight: 500; }
          
          .calendar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
          .month { }
          .month-name { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
          .month-days { font-size: 12px; color: #6b7280; }
          .active-day { color: #6366f1; font-weight: 500; }
          
          .reflection { background: #f9fafb; padding: 24px; border-radius: 12px; margin: 40px 0; }
          .reflection p { margin: 16px 0; }
          
          .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
        </style>
      </head>
      <body>
        <!-- Cover -->
        <div class="cover">
          <h1>${year}</h1>
          <h2>${displayName}</h2>
          <p>A Year in Kindness</p>
        </div>
        
        <!-- Key Stats -->
        <div class="section">
          <h3>Your Year at a Glance</h3>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${totalMoments}</div>
              <div class="stat-label">Total Moments</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${givenCount}/${receivedCount}</div>
              <div class="stat-label">Given / Received</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${bestStreak}</div>
              <div class="stat-label">Active Days</div>
            </div>
          </div>
        </div>

        <!-- Top Categories and People -->
        <div class="section">
          <h3>Your Kind Connections</h3>
          <div class="top-lists">
            <div class="top-list">
              <h4>Top Categories</h4>
              ${topCategories.map(({ name, count }) => `
                <div class="top-item">
                  <span class="item-name">${name}</span>
                  <span class="item-count">${count}</span>
                </div>
              `).join('')}
              ${topCategories.length === 0 ? '<p style="color: #9ca3af;">No categories recorded yet</p>' : ''}
            </div>
            <div class="top-list">
              <h4>Top People</h4>
              ${topPeople.slice(0, 5).map(({ name, count }) => `
                <div class="top-item">
                  <span class="item-name">${name}</span>
                  <span class="item-count">${count}</span>
                </div>
              `).join('')}
              ${topPeople.length === 0 ? '<p style="color: #9ca3af;">No people recorded yet</p>' : ''}
            </div>
          </div>
        </div>

        <!-- Monthly Activity Calendar -->
        <div class="section">
          <h3>Your Activity Throughout ${year}</h3>
          <div class="calendar">
            ${monthsInYear.map(month => `
              <div class="month">
                <div class="month-name">${month.name}</div>
                <div class="month-days">
                  ${month.activeDays.length > 0 
                    ? month.activeDays.map(day => `<span class="active-day">${day}</span>`).join(', ')
                    : '<span style="color: #d1d5db;">No activity</span>'
                  }
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${reflection?.data?.summary || reflection?.data?.suggestions ? `
          <!-- Reflection -->
          <div class="section">
            <h3>Your Journey Reflection</h3>
            <div class="reflection">
              ${reflection.data.summary ? `<p><strong>Your Story:</strong> ${reflection.data.summary}</p>` : ''}
              ${reflection.data.suggestions ? `<p><strong>Looking Forward:</strong> ${reflection.data.suggestions}</p>` : ''}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} • Kinjo Year in Kindness</p>
        </div>
      </body>
      </html>
    `

    // Return HTML content that can be printed to PDF
    return new Response(pdfContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="kinjo-${year}-summary.html"`
      },
    })

  } catch (error) {
    console.error('Error in export-pdf function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})