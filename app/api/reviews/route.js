export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const storeName = searchParams.get('storeName')
  const city = searchParams.get('city')
  const address = searchParams.get('address')

  try {
    // Step 1 - Find the place
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(`${storeName} ${address} ${city}`)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    const searchData = await searchRes.json()
    if (!searchData.candidates || searchData.candidates.length === 0) {
      return Response.json({ error: 'Store not found on Google Maps' }, { status: 404 })
    }

    const placeId = searchData.candidates[0].place_id

    // Step 2 - Get place details
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,url&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    const detailsData = await detailsRes.json()
    if (detailsData.status !== 'OK') {
      return Response.json({ error: 'Could not fetch place details' }, { status: 500 })
    }

    const details = detailsData.result
    const allReviews = details.reviews || []

    const positiveReviews = allReviews
      .filter(r => r.rating >= 4)
      .slice(0, 3)
      .map(r => ({
        rating: r.rating,
        text: r.text || '',
        author: r.author_name,
        time: r.relative_time_description
      }))

    const negativeReviews = allReviews
      .filter(r => r.rating <= 3)
      .slice(0, 3)
      .map(r => ({
        rating: r.rating,
        text: r.text || '',
        author: r.author_name,
        time: r.relative_time_description
      }))

    const avgRating = details.rating || 0
    let alertLevel = 'good'
    if (avgRating < 3.5) alertLevel = 'critical'
    else if (avgRating < 4.0) alertLevel = 'warning'

    // Step 3 - Claude analysis
    const reviewTexts = allReviews
      .map(r => `${r.rating} stars - ${r.author_name}: ${r.text?.substring(0, 150) || 'No text'}`)
      .join('\n\n')

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
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
          content: `Here are the most recent Google reviews for ${storeName} (${avgRating} stars, ${details.user_ratings_total} total reviews):

${reviewTexts}

Based on these reviews, respond with ONLY this JSON object:
{
  "commonPraise": ["specific thing customers love 1", "specific thing customers love 2", "specific thing customers love 3"],
  "commonComplaints": ["specific complaint 1", "specific complaint 2"],
  "areasToImprove": ["specific actionable improvement 1", "specific actionable improvement 2", "specific actionable improvement 3"],
  "customerSuggestions": ["specific thing customers asked for 1", "specific thing customers asked for 2"],
  "summary": "2 sentence summary of reputation and top priority to improve"
}`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    console.log('Claude status:', claudeData.type, 'Content blocks:', claudeData.content?.length)

    const claudeText = claudeData.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || ''

    console.log('Claude text:', claudeText.substring(0, 300))

    const jsonMatch = claudeText.match(/\{[\s\S]*\}/)
    
    let commonPraise = []
    let commonComplaints = []
    let areasToImprove = []
    let customerSuggestions = []
    let summary = `${storeName} has a ${avgRating} star rating based on ${details.user_ratings_total} Google reviews.`

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        commonPraise = parsed.commonPraise || []
        commonComplaints = parsed.commonComplaints || []
        areasToImprove = parsed.areasToImprove || []
        customerSuggestions = parsed.customerSuggestions || []
        summary = parsed.summary || summary
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr.message)
      }
    }

    return Response.json({
      googleRating: details.rating,
      totalReviews: details.user_ratings_total,
      placeId,
      googleMapsUrl: details.url,
      recentPositive: positiveReviews,
      recentNegative: negativeReviews,
      commonPraise,
      commonComplaints,
      areasToImprove,
      customerSuggestions,
      alertLevel,
      summary
    })

  } catch (err) {
    console.error('Reviews error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}