export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const storeType = searchParams.get('storeType')
  const city = searchParams.get('city')
  const month = new Date().toLocaleString('en-US', { month: 'long' })
  const year = new Date().getFullYear()

  try {
    // Step 1 — Search the web
    const searchResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for: current Canadian economy retail spending ${year}, seasonal shopping trends ${month} ${year}, ${storeType} retail trends Canada ${year}, ${city} retail news ${year}, social media trends ${storeType} furniture ${year}. Summarize what you find in plain text.`
        }]
      })
    })

    const searchData = await searchResponse.json()
    const searchText = searchData.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    if (!searchText) {
      return Response.json({ signal: 'neutral', summary: 'No trends data available right now', headlines: [] })
    }

    // Step 2 — Analyze and format
    const analyzeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `Based on this market research about "${storeType}" retail in "${city}" for ${month} ${year}:

${searchText}

Respond with ONLY a JSON object, no other text:
{
  "signal": "high or neutral or low",
  "emoji": "one relevant emoji",
  "summary": "3 sentence summary of demand outlook",
  "economy": "1 sentence on Canadian economy affecting retail",
  "seasonal": "1 sentence on what people are shopping for in ${month}",
  "social": "1 sentence on social media trends for this store type",
  "headlines": [
    {"title": "finding 1", "snippet": "detail"},
    {"title": "finding 2", "snippet": "detail"},
    {"title": "finding 3", "snippet": "detail"}
  ]
}`
        }]
      })
    })

    const analyzeData = await analyzeResponse.json()
    const analyzeText = analyzeData.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    const jsonMatch = analyzeText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ signal: 'neutral', summary: 'No trends data available right now', headlines: [] })
    }

    const parsed = JSON.parse(jsonMatch[0])
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
    return Response.json({ signal: 'neutral', summary: 'Unable to fetch market trends right now', headlines: [] })
  }
}