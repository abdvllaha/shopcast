export async function POST(request) {
  const { userId, predictions } = await request.json()

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const results = []

    // Get Google Ads token
    const { data: googleToken } = await supabase
      .from('google_ads_tokens').select('*').eq('user_id', userId).single()

    // Get Meta Ads token
    const { data: metaToken } = await supabase
      .from('meta_ads_tokens').select('*').eq('user_id', userId).single()

    // Calculate recommended budget based on predictions
    const getRecommendedBudget = (level, minBudget, maxBudget) => {
      const min = parseFloat(minBudget) || 10
      const max = parseFloat(maxBudget) || 100
      const range = max - min
      if (level === 'busy') return max
      if (level === 'normal') return min + (range * 0.6)
      return min
    }

    // Find highest traffic day this week
    const highestTrafficDay = predictions?.reduce((best, curr) => {
      const order = { busy: 3, normal: 2, slow: 1 }
      return (order[curr.level] > order[best.level]) ? curr : best
    }, predictions?.[0])

    const recommendedLevel = highestTrafficDay?.level || 'normal'

    // Optimize Google Ads
    if (googleToken) {
      const recommendedBudget = getRecommendedBudget(
        recommendedLevel,
        googleToken.min_budget,
        googleToken.max_budget
      )

      results.push({
        platform: 'Google Ads',
        recommended_budget: recommendedBudget,
        reason: `${recommendedLevel} traffic predicted — budget set to $${recommendedBudget.toFixed(2)}/day`,
        status: 'calculated'
      })
    }

    // Optimize Meta Ads
    if (metaToken) {
      const recommendedBudget = getRecommendedBudget(
        recommendedLevel,
        metaToken.min_budget,
        metaToken.max_budget
      )

      results.push({
        platform: 'Meta Ads',
        recommended_budget: recommendedBudget,
        reason: `${recommendedLevel} traffic predicted — budget set to $${recommendedBudget.toFixed(2)}/day`,
        status: 'calculated'
      })
    }

    return Response.json({ success: true, results, recommendedLevel })

  } catch (err) {
    console.error('Optimize ads error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}