export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
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
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for demographic and income data for the neighbourhood around "${address}" in ${city}, Canada. Look for average household income, population density, and typical resident profile for this specific area.

After searching, respond with ONLY this JSON object and nothing else:
{
  "medianIncome": 85000,
  "incomeLevel": "middle",
  "neighbourhood": "one sentence describing this neighbourhood",
  "retailImplication": "one sentence on retail strategy for this income level",
  "customerProfile": "one sentence on typical customer in this area"
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
      return Response.json({ error: 'Could not get demographics' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return Response.json(parsed)

  } catch (err) {
    console.error('Demographics error:', err.message)
    return Response.json({ error: 'Demographics unavailable' }, { status: 500 })
  }
}