export async function POST(request) {
  const { message, store, weather, events, recentLogs, salesHistory, demographics, chatHistory } = await request.json()

  const weatherSummary = weather?.daily?.time?.map((date, i) => {
    const max = Math.round(weather.daily.temperature_2m_max[i])
    const rain = weather.daily.precipitation_sum[i]
    return `${date}: ${max}°C, ${rain}mm rain`
  }).join(', ') || 'No weather data'

  const eventsSummary = events?.length > 0
    ? events.map(e => `${e.date}: ${e.name} at ${e.venue}`).join(', ')
    : 'No upcoming events'

  const logsSummary = recentLogs?.length > 0
    ? recentLogs.map(l => `${l.log_date}: ${l.traffic_level}`).join(', ')
    : 'No traffic history'

  const systemPrompt = `You are ShopCast AI, a friendly retail advisor for ${store.store_name} in ${store.city}.

Store Details:
- Name: ${store.store_name}
- Type: ${store.store_type}
- City: ${store.city}
- Address: ${store.address}

Current Data:
- 7-Day Weather: ${weatherSummary}
- Upcoming Events: ${eventsSummary}
- Recent Traffic History: ${logsSummary}
- Area Demographics: ${demographics ? `Median income $${demographics.medianIncome}, ${demographics.incomeLevel} income area, ${demographics.customerProfile}` : 'Not loaded'}
- Sales History: ${salesHistory?.length > 0 ? `${salesHistory.length} days of data available` : 'No sales history uploaded'}

You have deep knowledge of retail strategy, local events, weather impacts on foot traffic, and this specific store's data. Answer questions concisely and practically. Always give specific, actionable advice. Keep responses under 150 words unless asked for more detail.`

  const messages = [
    ...(chatHistory || []),
    { role: 'user', content: message }
  ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages
    })
  })

  const data = await response.json()
  const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.'

  return Response.json({ reply })
}