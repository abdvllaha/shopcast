export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const storeType = searchParams.get('storeType')
  const city = searchParams.get('city')
  const month = new Date().toLocaleString('en-US', { month: 'long' })
  const year = new Date().getFullYear()

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
        max_tokens: 800,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        messages: [{
          role: 'user',
          content: `You are a retail market analyst. Search the web to find current intelligence for a "${storeType}" store in "${city}" for ${month} ${year}.

Search for and analyze ALL of the following:
1. Current Canadian economy - interest rates, consumer confidence, inflation, spending trends
2. Seasonal shopping trends for ${month} - what are people buying right now?
3. Social media and Reddit trends - what are people saying about ${storeType} products right now?
4. Local ${city} retail news - any relevant local economic conditions
5. Industry trends for ${storeType} retail in Canada right now

Then respond with JSON only (no other text, no markdown):
{
  "signal": "high|neutral|low",
  "emoji": "relevant emoji",
  "summary": "3 sentence summary covering economy, seasonal trends, and social buzz relevant to this store right now",
  "economy": "1 sentence on current Canadian economic conditions affecting retail",
  "seasonal": "1 sentence on what people are shopping for this time of year",
  "social": "1 sentence on social media and Reddit trends relevant to this store type",
  "headlines": [
    {"title": "headline 1", "snippet": "brief description"},
    {"title": "headline 2", "snippet": "brief description"},
    {"title": "headline 3", "snippet": "brief description"},
    {"title": "headline 4", "snippet": "brief description"},
    {"title": "headline 5", "snippet": "brief description"}
  ]
}`
        }]
      })
    })

    const data = await response.json()
    
    if (!data.content || data.content.length === 0) {
      return Response.json({ signal: 'neutral', summary: 'No trends data available right now', headlines: [] })
    }

    // Combine all text blocks
    const allText = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Extract JSON from the response
    const jsonMatch = allText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ signal: 'neutral', summary: 'No trends data available right now', headlines: [] })
    }

    const clean = jsonMatch[0].replace(/```json|```/g, '').trim()
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message, 'Text:', allText.substring(0, 500))
      return Response.json({ signal: 'neutral', summary: 'Parse error: ' + parseErr.message, headlines: [] })
    }

    const stripCites = (text) => text?.replace(/<cite[^>]*>|<\/cite>/g, '') || ''
    parsed.summary = stripCites(parsed.summary)
    parsed.economy = stripCites(parsed.economy)
    parsed.seasonal = stripCites(parsed.seasonal)
    parsed.social = stripCites(parsed.social)
    if (parsed.headlines) {
      parsed.headlines = parsed.headlines.map(h => ({
        ...h,
        title: stripCites(h.title),
        snippet: stripCites(h.snippet)
      }))
    }

    return Response.json(parsed)

  } catch (err) {
    console.error('Trends error:', err.message)
    return Response.json({ signal: 'neutral', summary: err.message, headlines: [] })
  }
}