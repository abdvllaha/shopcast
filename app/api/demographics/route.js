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
          content: `Search for demographic and income data for the neighbourhood around "${address}" in ${city}, Canada. Find average household income and resident profile.

After searching, respond with ONLY these exact lines and nothing else:
INCOME: [number only, e.g. 85000]
LEVEL: [one of: low, middle, upper-middle, high]
NEIGHBOURHOOD: [one sentence]
CUSTOMER: [one sentence]
STRATEGY: [one sentence]`
        }]
      })
    })

    const data = await response.json()
    
    const allText = data.content
      ?.filter((b) => b.type === 'text')
      ?.map((b) => b.text)
      ?.join('') || ''

    const income = allText.match(/INCOME:\s*(\d+)/)?.[1] || '75000'
    const level = allText.match(/LEVEL:\s*([^\n]+)/)?.[1]?.trim() || 'middle'
    const neighbourhood = allText.match(/NEIGHBOURHOOD:\s*([^\n]+)/)?.[1]?.trim() || ''
    const customer = allText.match(/CUSTOMER:\s*([^\n]+)/)?.[1]?.trim() || ''
    const strategy = allText.match(/STRATEGY:\s*([^\n]+)/)?.[1]?.trim() || ''

    if (!neighbourhood) {
      return Response.json({ error: 'Could not get demographics' }, { status: 500 })
    }

    return Response.json({
      medianIncome: income,
      incomeLevel: level,
      neighbourhood,
      customerProfile: customer,
      retailImplication: strategy
    })

  } catch (err: any) {
    console.error('Demographics error:', err.message)
    return Response.json({ error: 'Demographics unavailable' }, { status: 500 })
  }
}