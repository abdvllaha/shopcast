export async function POST(request) {
  const { userId, weeklyPredictions } = await request.json()

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: googleTokens } = await supabase
      .from('google_ads_tokens').select('*').eq('user_id', userId)
    
    const { data: metaTokens } = await supabase
      .from('meta_ads_tokens').select('*').eq('user_id', userId)

    const google = googleTokens?.[0]
    const meta = metaTokens?.[0]

    const results = []
    const weeklyData = weeklyPredictions || []

    const getLevel = (p) => p.level || p.traffic_level || 'normal'
    const getDate = (p) => p.date || p.log_date || ''

    const getBudget = (level, min, max) => {
      const minB = parseFloat(min) || 10
      const maxB = parseFloat(max) || 100
      const range = maxB - minB
      if (level === 'busy') return maxB
      if (level === 'slow') return minB
      return minB + (range * 0.6)
    }

    const getOverallLevel = (predictions) => {
      if (!predictions || predictions.length === 0) return 'normal'
      const busy = predictions.filter(p => getLevel(p) === 'busy').length
      const slow = predictions.filter(p => getLevel(p) === 'slow').length
      const total = predictions.length
      if (busy / total >= 0.5) return 'busy'
      if (slow / total >= 0.5) return 'slow'
      return 'normal'
    }

    const overallLevel = getOverallLevel(weeklyData)

    if (google) {
      const recommendedBudget = getBudget(overallLevel, google.min_budget, google.max_budget)
      const dayBreakdown = weeklyData.map(p => ({
        date: getDate(p),
        budget: getBudget(getLevel(p), google.min_budget, google.max_budget)
      }))

      results.push({
        platform: 'Google Ads',
        recommended_budget: recommendedBudget,
        level: overallLevel,
        reason: `${overallLevel} traffic week predicted — budget set to $${recommendedBudget.toFixed(2)}/day`,
        dayBreakdown
      })
    }

    if (meta) {
      const recommendedBudget = getBudget(overallLevel, meta.min_budget, meta.max_budget)
      const dayBreakdown = weeklyData.map(p => ({
        date: getDate(p),
        budget: getBudget(getLevel(p), meta.min_budget, meta.max_budget)
      }))

      results.push({
        platform: 'Meta Ads',
        recommended_budget: recommendedBudget,
        level: overallLevel,
        reason: `${overallLevel} traffic week predicted — budget set to $${recommendedBudget.toFixed(2)}/day`,
        dayBreakdown
      })
    }

    return Response.json({ success: true, results, recommendedLevel: overallLevel })

  } catch (err) {
    console.error('Optimize ads error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}