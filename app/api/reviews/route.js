export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const storeName = searchParams.get('storeName')
  const city = searchParams.get('city')
  const address = searchParams.get('address')

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
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search Google for reviews of "${storeName}" located at "${address}" in ${city}, Canada. Search for their Google Maps rating, recent 5-star reviews, and recent 1-2 star complaints. Also search for "${storeName} ${city} reviews 2025 2026".

Respond with ONLY this JSON object:
{
  "googleRating": 4.2,
  "totalReviews": 150,
  "recentPositive": ["one sentence summary of a positive review", "one sentence summary of another positive review"],
  "recentNegative": ["one sentence summary of a negative review", "one sentence summary of another negative review"],
  "commonPraise": ["thing customers love 1", "thing customers love 2", "thing customers love 3"],
  "commonComplaints": ["common complaint 1", "common complaint 2", "common complaint 3"],
  "alertLevel": "good",
  "summary": "2 sentence summary of their Google reputation right now"
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
      return Response.json({ error: 'Could not fetch reviews' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    const stripCites = (text) => text?.replace(/<cite[^>]*>|<\/cite>/g, '') || ''
    const stripArray = (arr) => arr?.map(stripCites) || []
    
    parsed.summary = stripCites(parsed.summary)
    parsed.recentPositive = stripArray(parsed.recentPositive)
    parsed.recentNegative = stripArray(parsed.recentNegative)
    parsed.commonPraise = stripArray(parsed.commonPraise)
    parsed.commonComplaints = stripArray(parsed.commonComplaints)

    return Response.json(parsed)

  } catch (err) {
    console.error('Reviews error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}