export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const storeType = searchParams.get('storeType')
  const city = searchParams.get('city')

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
        max_tokens: 500,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        messages: [{
          role: 'user',
          content: `Search the web for recent news and consumer trends about "${storeType}" retail shopping in "${city}" in 2026. 

Then respond with JSON only (no other text):
{
  "signal": "high|neutral|low",
  "summary": "2 sentence summary of current consumer demand and trends for this store type in this city",
  "emoji": "relevant emoji",
  "headlines": [
    {"title": "headline 1", "snippet": "brief description"},
    {"title": "headline 2", "snippet": "brief description"},
    {"title": "headline 3", "snippet": "brief description"}
  ]
}`
        }]
      })
    })

    const data = await response.json()
    
    const textBlock = data.content?.find(block => block.type === 'text')
    if (!textBlock) {
      return Response.json({ signal: 'neutral', summary: 'No trends data available right now', headlines: [] })
    }

    const clean = textBlock.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    // Strip citation tags from all text fields
const stripCites = (text) => text?.replace(/<cite[^>]*>|<\/cite>/g, '') || ''
parsed.summary = stripCites(parsed.summary)
if (parsed.headlines) {
  parsed.headlines = parsed.headlines.map(h => ({
    ...h,
    title: stripCites(h.title),
    snippet: stripCites(h.snippet)
  }))
}
    return Response.json(parsed)

  } catch (err) {
    return Response.json({ signal: 'neutral', summary: 'Unable to fetch market trends', headlines: [] })
  }
}