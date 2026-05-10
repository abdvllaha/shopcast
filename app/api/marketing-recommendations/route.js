export async function POST(request) {
  const { store, weather, events, demographics, trends, websiteScan, competitorAnalysis, recentLogs } = await request.json()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const weatherSummary = weather?.daily?.time?.slice(0, 7).map((date, i) => {
    const max = Math.round(weather.daily.temperature_2m_max[i])
    const rain = weather.daily.precipitation_sum[i]
    return `${date}: ${max}°C, ${rain}mm rain`
  }).join(', ') || 'No weather data'

  const eventsSummary = events?.length > 0
    ? events.slice(0, 5).map(e => `${e.date}: ${e.name}`).join(', ')
    : 'No upcoming events'

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `You are a senior marketing strategist for retail businesses. Search for current Google Ads keyword costs and Facebook ad benchmarks for "${store.store_type}" retailers in ${store.city}, Canada.

Then create a comprehensive marketing action plan using ALL of this data:
TODAY'S DATE: ${today}
Use this exact date to calculate all day names correctly. Do not guess what day of the week any date falls on — calculate it from today's date.
STORE: ${store.store_name}
TYPE: ${store.store_type}
CITY: ${store.city}
WEBSITE: ${store.website_url || 'Not provided'}

AREA DEMOGRAPHICS:
- Median income: $${demographics?.medianIncome || 'Unknown'}
- Income level: ${demographics?.incomeLevel || 'Unknown'}
- Customer profile: ${demographics?.customerProfile || 'Unknown'}

CURRENT WEEK WEATHER: ${weatherSummary}

LOCAL EVENTS: ${eventsSummary}

MARKET TRENDS:
${trends?.summary || 'No trend data'}
Economy: ${trends?.economy || 'Unknown'}
Seasonal: ${trends?.seasonal || 'Unknown'}

WEBSITE & SOCIAL:
Online presence: ${websiteScan?.onlinePresence || 'Unknown'}
Customer sentiment: ${websiteScan?.socialSentiment || 'Unknown'}
Current promotions: ${websiteScan?.promotions?.join(', ') || 'None found'}
Issues to fix: ${websiteScan?.opportunities?.join(', ') || 'None identified'}

COMPETITOR LANDSCAPE:
${competitorAnalysis?.summary || 'No competitor data'}
Threats: ${competitorAnalysis?.threats?.join(', ') || 'None identified'}

RECENT TRAFFIC HISTORY:
${recentLogs?.slice(0, 5).map(l => `${l.log_date}: ${l.traffic_level}`).join(', ') || 'No history'}

Create a complete marketing strategy. Respond with ONLY this JSON:
{
  "headline": "one punchy strategic headline for this week",
  "urgency": "high|medium|low",
  "googleAds": {
    "recommendedBudget": 150,
    "topKeywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
    "estimatedCPC": "$2.50-4.00",
    "bestDaysToRun": ["Friday", "Saturday"],
    "adCopyIdea": "one specific ad headline to test"
  },
  "metaAds": {
    "recommendedBudget": 100,
    "targetAudience": "description of who to target",
    "bestFormat": "carousel/single image/video/story",
    "bestTimeToPost": "time of day",
    "adCopyIdea": "one specific Facebook/Instagram ad idea"
  },
  "promotions": [
    {"name": "promotion name", "timing": "when to run it", "expectedLift": "estimated revenue lift", "description": "what to do"},
    {"name": "promotion name 2", "timing": "when", "expectedLift": "lift", "description": "what to do"}
  ],
  "contentCalendar": [
    {"day": "Monday", "platform": "Instagram", "content": "what to post"},
    {"day": "Wednesday", "platform": "Facebook", "content": "what to post"},
    {"day": "Friday", "platform": "Instagram", "content": "what to post"},
    {"day": "Saturday", "platform": "Google", "content": "ad to run"}
  ],
  "quickWins": ["quick win action 1", "quick win action 2", "quick win action 3"],
  "weeklyBudgetBreakdown": {
    "googleAds": 150,
    "metaAds": 100,
    "promotions": 200,
    "total": 450
  },
  "summary": "3 sentence strategic summary of the week's marketing priorities"
}`
        }]
      })
    })

    const data = await response.json()
    const allText = data.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    const jsonMatch = allText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Could not generate recommendations' }, { status: 500 })
    }

    const stripCites = (text) => text?.replace(/<cite[^>]*>|<\/cite>/g, '') || ''
    
    const stripObject = (obj) => {
      if (typeof obj === 'string') return stripCites(obj)
      if (Array.isArray(obj)) return obj.map(stripObject)
      if (typeof obj === 'object' && obj !== null) {
        const result = {}
        for (const key in obj) result[key] = stripObject(obj[key])
        return result
      }
      return obj
    }

    const parsed = JSON.parse(jsonMatch[0])
    const cleaned = stripObject(parsed)
    return Response.json(cleaned)

  } catch (err) {
    console.error('Marketing recommendations error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}