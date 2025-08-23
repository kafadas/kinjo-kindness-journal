import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrendsQuery {
  range: number // days
  action?: 'given' | 'received' | 'both'
  significance?: boolean
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const range = parseInt(url.searchParams.get('range') || '90')
    const action = url.searchParams.get('action') as 'given' | 'received' | 'both' | null
    const significance = url.searchParams.get('significance') === 'true'

    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - range)
    
    // For baseline comparison (previous equal window)
    const baselineFromDate = new Date(fromDate)
    baselineFromDate.setDate(baselineFromDate.getDate() - range)

    // Build base query conditions
    let actionFilter = ''
    if (action && action !== 'both') {
      actionFilter = `AND m.action = '${action}'`
    }
    
    let significanceFilter = ''
    if (significance) {
      significanceFilter = 'AND m.significance = true'
    }

    // 1. Daily series data
    const { data: seriesData, error: seriesError } = await supabase
      .from('moments')
      .select('happened_at, action, significance')
      .eq('user_id', user.id)
      .gte('happened_at', fromDate.toISOString())
      .then(({ data, error }) => {
        if (error) return { data: null, error }
        
        const dateMap = new Map<string, { total: number, given: number, received: number }>()
        
        // Initialize all dates in range
        for (let d = new Date(fromDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          dateMap.set(dateStr, { total: 0, given: 0, received: 0 })
        }
        
        // Fill with actual data
        data?.forEach(moment => {
          if (significance && !moment.significance) return
          if (action && action !== 'both' && moment.action !== action) return
          
          const dateStr = new Date(moment.happened_at).toISOString().split('T')[0]
          const existing = dateMap.get(dateStr) || { total: 0, given: 0, received: 0 }
          
          existing.total++
          if (moment.action === 'given') existing.given++
          if (moment.action === 'received') existing.received++
          
          dateMap.set(dateStr, existing)
        })
        
        const result = Array.from(dateMap.entries()).map(([date, counts]) => ({
          date,
          ...counts
        })).sort((a, b) => a.date.localeCompare(b.date))
        
        return { data: result, error: null }
      })

    if (seriesError) {
      console.error('Series data error:', seriesError)
      throw seriesError
    }

    // 2. Category share data with baseline comparison
    const [currentPeriod, baselinePeriod] = await Promise.all([
      supabase
        .from('moments')
        .select('category_id, action, significance, categories!inner(id, name)')
        .eq('user_id', user.id)
        .gte('happened_at', fromDate.toISOString())
        .then(({ data, error }) => {
          if (error) return { data: null, error }
          
          let filtered = data || []
          if (action && action !== 'both') {
            filtered = filtered.filter(m => m.action === action)
          }
          if (significance) {
            filtered = filtered.filter(m => m.significance)
          }
          
          return { data: filtered, error: null }
        }),
      supabase
        .from('moments')
        .select('category_id, action, significance')
        .eq('user_id', user.id)
        .gte('happened_at', baselineFromDate.toISOString())
        .lt('happened_at', fromDate.toISOString())
        .then(({ data, error }) => {
          if (error) return { data: null, error }
          
          let filtered = data || []
          if (action && action !== 'both') {
            filtered = filtered.filter(m => m.action === action)
          }
          if (significance) {
            filtered = filtered.filter(m => m.significance)
          }
          
          return { data: filtered, error: null }
        })
    ])

    const categoryError = currentPeriod.error || baselinePeriod.error
    if (categoryError) {
      console.error('Category data error:', categoryError)
      throw categoryError
    }

    // Process category data
    const currentCounts = new Map<string, { id: string, name: string, count: number }>()
    currentPeriod.data?.forEach(moment => {
      const key = moment.category_id
      const existing = currentCounts.get(key) || { 
        id: key, 
        name: moment.categories.name, 
        count: 0 
      }
      existing.count++
      currentCounts.set(key, existing)
    })

    const baselineCounts = new Map<string, number>()
    baselinePeriod.data?.forEach(moment => {
      const key = moment.category_id
      baselineCounts.set(key, (baselineCounts.get(key) || 0) + 1)
    })

    const currentTotal = Array.from(currentCounts.values()).reduce((sum, cat) => sum + cat.count, 0)
    const baselineTotal = Array.from(baselineCounts.values()).reduce((sum, count) => sum + count, 0)

    const categoryData = Array.from(currentCounts.values())
      .filter(cat => cat.count > 0)
      .map(cat => {
        const pct = currentTotal > 0 ? Math.round((cat.count / currentTotal) * 100 * 10) / 10 : 0
        const baselineCount = baselineCounts.get(cat.id) || 0
        const baselinePct = baselineTotal > 0 ? (baselineCount / baselineTotal) * 100 : 0
        const deltaPct = Math.round((pct - baselinePct) * 10) / 10
        
        return {
          category_id: cat.id,
          name: cat.name,
          pct,
          delta_pct: deltaPct
        }
      })
      .sort((a, b) => b.pct - a.pct)

    // 3. Median days between moments per category
    const { data: momentsForGaps, error: medianError } = await supabase
      .from('moments')
      .select('category_id, happened_at, action, significance, categories!inner(id, name)')
      .eq('user_id', user.id)
      .gte('happened_at', fromDate.toISOString())
      .order('category_id, happened_at')

    if (medianError) {
      console.error('Median data error:', medianError)
      throw medianError
    }

    // Calculate median gaps
    const categoryGaps = new Map<string, { name: string, gaps: number[] }>()
    
    let filtered = momentsForGaps || []
    if (action && action !== 'both') {
      filtered = filtered.filter(m => m.action === action)
    }
    if (significance) {
      filtered = filtered.filter(m => m.significance)
    }

    filtered.forEach((moment, index) => {
      const categoryId = moment.category_id
      const categoryName = moment.categories.name
      
      if (!categoryGaps.has(categoryId)) {
        categoryGaps.set(categoryId, { name: categoryName, gaps: [] })
      }
      
      // Find previous moment in same category
      const prevMoment = filtered
        .slice(0, index)
        .reverse()
        .find(m => m.category_id === categoryId)
      
      if (prevMoment) {
        const gap = (new Date(moment.happened_at).getTime() - new Date(prevMoment.happened_at).getTime()) / (1000 * 60 * 60 * 24)
        categoryGaps.get(categoryId)?.gaps.push(gap)
      }
    })

    const medianData = Array.from(categoryGaps.entries())
      .filter(([_, data]) => data.gaps.length >= 2)
      .map(([categoryId, data]) => {
        const sortedGaps = data.gaps.sort((a, b) => a - b)
        const median = sortedGaps.length % 2 === 0
          ? (sortedGaps[sortedGaps.length / 2 - 1] + sortedGaps[sortedGaps.length / 2]) / 2
          : sortedGaps[Math.floor(sortedGaps.length / 2)]
        
        return {
          category_id: categoryId,
          name: data.name,
          median_days: Math.round(median)
        }
      })
      .sort((a, b) => a.median_days - b.median_days)

    const response = {
      seriesDaily: seriesData || [],
      categoryShare: categoryData || [],
      medianGaps: medianData || []
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Trends data error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}