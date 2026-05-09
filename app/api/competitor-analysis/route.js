export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const storeJson = searchParams.get('store')
  const store = JSON.parse(storeJson)

  try {
    // Get competitors from Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('user_id', userId)

    if (!competitors || competitors.length === 0) {
      return Response.json({ error: 'No competitors added yet' })
    }

    // Get traffic data for each competitor
    const competitorTraffic = await Promise.all(
      competitors.map(async (comp) => {
        try {
          const trafficRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/road-traffic?address=${encodeURIComponent(comp.address)}&city=${encodeURIComponent(comp.city)}`
          )
          const trafficData = await trafficRes.json()
          return {
            name: comp.competitor_name,
            address: comp.address,
            city: comp.city,
            traffic: trafficData
          }
        } catch (err) {
          return {
            name: comp.competitor_name,
            address: comp.address,
            city: comp.city,
            traffic: null
          }
        }
      })
    )

    // Get your store's traffic
    const myTrafficRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/road-traffic?address=${encodeURIComponent(store.address)}&city=${encodeURIComponent(store.city)}`
    )
    const myTraffic = await myTrafficRes.json()

    // AI analysis
    const trafficSummary = competitorTraffic.map(c => 
      `${c.name}: ${c.traffic?.trafficLabel || 'Unknown'} (${c.traffic?.currentSpeed || 'N/A'} km/h, ${c.traffic?.trafficRatio || 'N/A'}% of normal flow)`
    ).join('\n')

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `You are a retail competitive analyst. Search for recent news about these competitors of ${store.store_name} in ${store.city}: ${competitors.map(c => c.competitor_name).join(', ')}.

Current road traffic data:
Your store (${store.store_name}): ${myTraffic.trafficLabel || 'Unknown'} (${myTraffic.currentSpeed || 'N/A'} km/h)
${trafficSummary}

Search for any recent promotions, sales events, store openings/closings, or news about these competitors. Then provide a competitive analysis.

Respond with ONLY a JSON object:
{
  "advantage": "your store or competitor name that has traffic advantage right now",
  "summary": "2 sentence competitive summary",
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "threats": ["threat 1", "threat 2"],
  "news": [{"competitor": "name", "headline": "recent news headline", "implication": "what this means for you"}]
}`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    const text = claudeData.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ 
        competitorTraffic, 
        myTraffic,
        summary: 'Competitor traffic data loaded. Add more data over time for AI analysis.',
        opportunities: [],
        threats: [],
        news: []
      })
    }

    const analysis = JSON.parse(jsonMatch[0])
    
    // Strip citation tags
    const stripCites = (text) => text?.replace(/<cite[^>]*>|<\/cite>/g, '') || ''
    if (analysis.summary) analysis.summary = stripCites(analysis.summary)
    if (analysis.opportunities) analysis.opportunities = analysis.opportunities.map(stripCites)
    if (analysis.threats) analysis.threats = analysis.threats.map(stripCites)
    if (analysis.news) analysis.news = analysis.news.map(n => ({
      ...n,
      headline: stripCites(n.headline),
      implication: stripCites(n.implication)
    }))

    return Response.json({ competitorTraffic, myTraffic, ...analysis })

  } catch (err) {
    console.error('Competitor analysis error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}