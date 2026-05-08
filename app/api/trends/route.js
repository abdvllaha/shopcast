export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const storeType = searchParams.get('storeType')
  const city = searchParams.get('city')
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  try {
    const query = `${storeType} ${city} shopping 2026`
    
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}&dateRestrict=w1&num=5`
    )
    const data = await res.json()

    if (!data.items || data.items.length === 0) {
      return Response.json({ signal: 'neutral', headlines: [], summary: 'No recent search trends found' })
    }

    const headlines = data.items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }))

    // Send to Claude to summarize the demand signal
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Based on these recent search results about "${storeType}" in "${city}", give a 2-sentence demand signal summary for a retailer. Is interest high, low or neutral? What are people looking for?

Search results:
${headlines.map(h => `- ${h.title}: ${h.snippet}`).join('\n')}

Respond with JSON only: {"signal": "high|neutral|low", "summary": "2 sentence summary", "emoji": "relevant emoji"}`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    const text = claudeData.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return Response.json({ ...parsed, headlines })
  } catch (err) {
    return Response.json({ signal: 'neutral', summary: 'Unable to fetch trends data', headlines: [] })
  }
}