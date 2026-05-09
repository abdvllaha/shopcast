export async function POST(request) {
  try {
    const { websiteUrl, store } = await request.json()

    if (!websiteUrl) {
      return Response.json({ error: 'No website URL provided' }, { status: 400 })
    }

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
          content: `Search for information about this retail store: "${store.store_name}" located in ${store.city}. Also search for their website: ${websiteUrl}

Find:
1. Current promotions or sales
2. Customer reviews and sentiment
3. Their online presence strength
4. Price range of products

Respond with ONLY this JSON object and nothing else:
{
  "promotions": ["promotion 1", "promotion 2"],
  "priceRange": "budget",
  "onlinePresence": "moderate",
  "socialSentiment": "positive",
  "sentimentSummary": "customers seem happy with the store",
  "trafficEstimate": "medium",
  "topProducts": ["product 1", "product 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "summary": "two sentence summary here"
}`
        }]
      })
    })

    if (!response.ok) {
      const errData = await response.json()
      console.error('Anthropic error:', JSON.stringify(errData))
      return Response.json({ error: 'AI error', details: errData }, { status: 500 })
    }

    const data = await response.json()
    const allText = data.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    console.log('Website scanner response:', allText.substring(0, 200))

    const jsonMatch = allText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', allText)
      return Response.json({ 
        promotions: [],
        priceRange: 'unknown',
        onlinePresence: 'moderate',
        socialSentiment: 'neutral',
        sentimentSummary: 'Unable to analyze sentiment',
        trafficEstimate: 'medium',
        topProducts: [],
        opportunities: [],
        summary: 'Could not fully analyze this website. Try again.'
      })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return Response.json(parsed)

  } catch (err) {
    console.error('Website scanner error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}