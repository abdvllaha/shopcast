export async function POST(request) {
  const { userId, weeklyPredictions } = await request.json()

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const results = []

    const { data: googleToken } = await supabase
      .from('google_ads_tokens').select('*').eq('user_id', userId)
    
    const { data: metaToken } = await supabase
      .from('meta_ads_tokens').select('*').eq('user_id', userId)

    const google = googleToken?.[0]
    const meta = metaToken?.[0]

    // Calculate budget based on weekly predictions
    const getBudgetRecommendation = (predictions, minBudget, maxBudget) => {
      const min = parseFloat(minBudget) || 10
      const max = parseFloat(maxBudget) || 100
      const range = max - min

      if (!predictions || predictions.length === 0) {
        return { budget: min + (range * 0.6), level: 'normal' }
      }

      const busyDays = predictions.filter(p => p.level === 'busy').length
      const slowDays = predictions.filter(p => p.level === 'slow').length
      const total = predictions.length

      const busyRatio = busyDays / total
      const slowRatio = slowDays / total

      let level, budget
      if (busyRatio >= 0.5) {
        level = 'busy'
        budget = max
      } else if (slowRatio >= 0.5) {
        level = 'slow'
        budget = min
      } else {
        level = 'normal'
        budget = min + (range * 0.6)
      }

      return { budget, level }
    }

    const weeklyData = weeklyPredictions || []
    
    if (google) {
      const { budget, level } = getBudgetRecommendation(weeklyData, google.min_budget, google.max_budget)
      const dayBreakdown = weeklyData.map(p => ({
        date: p.date,
        budget: p.level === 'busy' ? google.max_budget : 
                p.level === 'slow' ? google.min_budget : 
                google.min_budget + ((google.max_budget - google.min_budget) * 0.6)
      }))

      results.push({
        platform: 'Google Ads',
        recommended_budget: budget,
        level,
        reason: `${level} traffic week predicted — budget set to $${budget.toFixed(2)}/day`,
        dayBreakdown
      })
    }

    if (meta) {
      const { budget, level } = getBudgetRecommendation(weeklyData, meta.min_budget, meta.max_budget)
      const dayBreakdown = weeklyData.map(p => ({
        date: p.date,
        budget: p.level === 'busy' ? meta.max_budget :
                p.level === 'slow' ? meta.min_budget :
                meta.min_budget + ((meta.max_budget - meta.min_budget) * 0.6)
      }))

      results.push({
        platform: 'Meta Ads',
        recommended_budget: budget,
        level,
        reason: `${level} traffic week predicted — budget set to $${budget.toFixed(2)}/day`,
        dayBreakdown
      })
    }

    const overallLevel = results[0]?.level || 'normal'
    return Response.json({ success: true, results, recommendedLevel: overallLevel })

  } catch (err) {
    console.error('Optimize ads error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}