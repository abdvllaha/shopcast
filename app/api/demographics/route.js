export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city = searchParams.get('city')

  try {
    // Step 1 - Get coordinates from address
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    )
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) {
      return Response.json({ error: 'Location not found' }, { status: 404 })
    }

    const { latitude, longitude } = geoData.results[0]

    // Step 2 - Get census income data from Statistics Canada via CensusMapper
    const censusRes = await fetch(
      `https://censusmapper.ca/api/v1/geo.json?level=CT&lat=${latitude}&lng=${longitude}`
    )
    
    if (!censusRes.ok) {
      throw new Error('Census data unavailable')
    }

    const censusData = await censusRes.json()

    // Step 3 - Use Claude to interpret the demographic data
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for the average household income and demographic profile for the ${address} area in ${city}, Canada. What income bracket are residents in this neighbourhood? What does this mean for local retail?

Respond with ONLY a JSON object:
{
  "medianIncome": "estimated median household income as a number e.g. 85000",
  "incomeLevel": "low or middle or upper-middle or high",
  "neighbourhood": "1 sentence describing the neighbourhood demographic",
  "retailImplication": "1 sentence on what this means for retail strategy",
  "customerProfile": "1 sentence describing the typical customer in this area"
}`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    const text = claudeData.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Could not parse demographics' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    parsed.latitude = latitude
    parsed.longitude = longitude

    return Response.json(parsed)

  } catch (err) {
    console.error('Demographics error:', err.message)
    
    // Fallback - use Claude web search only
    try {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Search for the average household income and demographic profile for the ${address} area in ${city}, Canada. What income bracket are residents in this neighbourhood?

Respond with ONLY a JSON object:
{
  "medianIncome": "estimated median household income as a number e.g. 85000",
  "incomeLevel": "low or middle or upper-middle or high",
  "neighbourhood": "1 sentence describing the neighbourhood demographic",
  "retailImplication": "1 sentence on what this means for retail strategy",
  "customerProfile": "1 sentence describing the typical customer in this area"
}`
          }]
        })
      })

      const claudeData = await claudeRes.json()
      const text = claudeData.content
        ?.filter(b => b.type === 'text')
        ?.map(b => b.text)
        ?.join('') || ''

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return Response.json({ error: 'Demographics unavailable' }, { status: 500 })
      }

      return Response.json(JSON.parse(jsonMatch[0]))
    } catch (fallbackErr) {
      return Response.json({ error: 'Demographics unavailable' }, { status: 500 })
    }
  }
}