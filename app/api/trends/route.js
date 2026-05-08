export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const storeType = searchParams.get('storeType')
  const city = searchParams.get('city')
  const apiKey = process.env.NEWS_API_KEY

  try {
    const query = `${storeType} ${city} shopping retail`
    
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${apiKey}`
    )
    const data = await res.json()

    if (!data.articles || data.articles.length === 0) {
      return Response.json({ signal: 'neutral', headlines: [], summary: 'No recent news found for this area' })
    }

    const headlines = data.articles.map(article => ({
      title: article.title,
      snippet: article.description,
      link: article.url,
      source: article.source.name
    }))

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
          content: `Based on these recent news articles about "${storeType}" retail in "${city}", give a 2-sentence demand signal summary for a small retailer. Is consumer interest high, low or neutral right now?

Articles:
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
    return Response.json({ signal: 'neutral', summary: 'Unable to fetch market trends', headlines: [] })
  }
}