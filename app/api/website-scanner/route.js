export async function POST(request) {
  const { websiteUrl, store } = await request.json()

  if (!websiteUrl) {
    return Response.json({ error: 'No website URL provided' }, { status: 400 })
  }

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
          content: `Search for the following about this retail store website: ${websiteUrl}

For the store "${store.store_name}" in ${store.city}, find:
1. Current promotions and sales on their website
2. Their current pricing and product range
3. Recent social media activity and mentions (Facebook, Instagram, Google reviews)
4. Customer sentiment and reviews
5. Estimated website traffic and online presence strength
6. How their online presence compares to typical ${store.store_type} retailers

Respond with ONLY this JSON object:
{
  "promotions": ["current promotion 1", "current promotion 2"],
  "priceRange": "budget/mid-range/premium",
  "onlinePresence": "weak/moderate/strong",
  "socialSentiment": "positive/neutral/negative",
  "sentimentSummary": "one sentence on customer sentiment",
  "trafficEstimate": "low/medium/high",
  "topProducts": ["product or category 1", "product or category 2"],
  "opportunities": ["opportunity based on their online gaps 1", "opportunity 2"],
  "summary": "2 sentence summary of their online presence and what it means for your store"
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
      return Response.json({ error: 'Could not analyze website' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return Response.json(parsed)

  } catch (err) {
    console.error('Website scanner error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}