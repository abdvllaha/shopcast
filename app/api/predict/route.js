export async function POST(request) {
  const { store, weather, events, recentLogs } = await request.json()

  const weatherSummary = weather.daily.time.map((date, i) => {
    const code = weather.daily.weathercode[i]
    const max = Math.round(weather.daily.temperature_2m_max[i])
    const rain = weather.daily.precipitation_sum[i]
    return `${date}: temp ${max}°C, rain ${rain}mm, code ${code}`
  }).join('\n')

  const eventsSummary = events.length > 0
    ? events.map(e => `${e.date}: ${e.name} at ${e.venue} (${e.type})`).join('\n')
    : 'No major events this week'

  const logsSummary = recentLogs && recentLogs.length > 0
    ? recentLogs.map(l => `${l.log_date}: ${l.traffic_level}`).join('\n')
    : 'No historical data yet'

  const prompt = `You are ShopCast, an AI assistant for small retail stores. Analyze the following data and provide a complete weekly action plan.

Store: ${store.store_name}
Store Description: ${store.store_type}
City: ${store.city}

7-Day Weather Forecast:
${weatherSummary}

Upcoming Local Events:
${eventsSummary}

Recent Traffic History:
${logsSummary}

Please provide the following sections:

## 📅 Day-by-Day Traffic Prediction
For each day, use this exact format on its own line:
**[Date] — [Low/Medium/High]**
Reason: [one sentence why]
Revenue: [dollar estimate opportunity or risk]

Do this for all 7 days. Do NOT use markdown tables.

## 👥 Staffing Recommendations
Top 3 specific staffing recommendations for the week based on predicted traffic.

## 💰 Revenue Opportunities
Top 3 specific ways to maximize revenue this week based on events and weather. Include estimated dollar impact for each.

## 📱 Ready-to-Post Social Media Captions
3 social media captions the retailer can copy and post this week. Make them specific to their store type and the local events/weather. Format each as:
**[Day/Occasion]:** "[Caption text with emojis]"

## 📊 Weekly Outlook Summary
One paragraph summary of the week ahead and the single most important action the retailer should take.

Keep everything specific to this store type and city. Be direct and practical.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Anthropic API error:', JSON.stringify(data))
    return Response.json({ error: 'AI error', details: data }, { status: 500 })
  }

  const text = data.content[0].text
  return Response.json({ prediction: text })
}