export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city = searchParams.get('city')

  try {
    // Step 1 - Search for demographic data
    const searchResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for: average household income ${address} ${city} Canada neighbourhood demographics. Also search for: ${city} neighbourhood income levels statistics Canada census. Summarize what you find about income levels and demographics in this area.`
        }]
      })
    })

    const searchData = await searchResponse.json()
    const searchText = searchData.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    // Step 2 - Structure the data
    const structureResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Based on this research about "${address}" in ${city}, Canada:

${searchText || 'No specific data found, use general knowledge about this area'}

Extract or estimate the following. Respond with ONLY a JSON object:
{
  "medianIncome": 85000,
  "incomeLevel": "middle",
  "neighbourhood": "one sentence describing this specific neighbourhood",
  "customerProfile": "one sentence on who shops here and what they value",
  "retailImplication": "one specific sentence on retail strategy for this income level and area"
}`
        }]
      })
    })

    const structureData = await structureResponse.json()
    const structureText = structureData.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    const jsonMatch = structureText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse demographics')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return Response.json(parsed)

  } catch (err) {
    console.error('Demographics error:', err.message)
    return Response.json({ error: 'Demographics unavailable' }, { status: 500 })
  }
}