export async function POST(request) {
  const { store, weather, events } = await request.json()

  const weatherSummary = weather.daily.time.map((date, i) => {
    const code = weather.daily.weathercode[i]
    const max = Math.round(weather.daily.temperature_2m_max[i])
    const rain = weather.daily.precipitation_sum[i]
    return `${date}: temp ${max}°C, rain ${rain}mm, code ${code}`
  }).join('\n')

  const eventsSummary = events.length > 0
    ? events.map(e => `${e.date}: ${e.name} at ${e.venue} (${e.type})`).join('\n')
    : 'No major events this week'

  const prompt = `You are ShopCast, an AI assistant for small retail stores. Analyze the following data and provide a weekly foot traffic prediction and action plan.

Store: ${store.store_name}
Store Type: ${store.store_type}
City: ${store.city}

7-Day Weather Forecast:
${weatherSummary}

Upcoming Local Events:
${eventsSummary}

Please provide:
1. A day-by-day traffic prediction (Low/Medium/High) with a one-line reason
2. Top 3 staffing recommendations for the week
3. Top 3 promotional opportunities based on events or weather

Keep your response concise, practical and specific to this store type. Use emojis to make it scannable.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
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