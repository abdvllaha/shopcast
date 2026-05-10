export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const storeName = searchParams.get('storeName')
  const city = searchParams.get('city')
  const address = searchParams.get('address')

  try {
    // Step 1 - Find the place ID using Places Text Search
    const searchQuery = `${storeName} ${address} ${city}`
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    const searchData = await searchRes.json()

    if (!searchData.candidates || searchData.candidates.length === 0) {
      return Response.json({ error: 'Store not found on Google Maps' }, { status: 404 })
    }

    const place = searchData.candidates[0]
    const placeId = place.place_id

    // Step 2 - Get full place details including reviews
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,url&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    const detailsData = await detailsRes.json()

    if (detailsData.status !== 'OK') {
      return Response.json({ error: 'Could not fetch place details' }, { status: 500 })
    }

    const details = detailsData.result
    const reviews = details.reviews || []

    // Separate positive and negative reviews
    const positiveReviews = reviews
      .filter(r => r.rating >= 4)
      .slice(0, 3)
      .map(r => ({
        rating: r.rating,
        text: r.text?.substring(0, 300) || '',
        author: r.author_name,
        time: r.relative_time_description
      }))

    const negativeReviews = reviews
      .filter(r => r.rating <= 2)
      .slice(0, 3)
      .map(r => ({
        rating: r.rating,
        text: r.text?.substring(0, 300) || '',
        author: r.author_name,
        time: r.relative_time_description
      }))

    const avgRating = details.rating || 0
    let alertLevel = 'good'
    if (avgRating < 3.5) alertLevel = 'critical'
    else if (avgRating < 4.0) alertLevel = 'warning'

    // Use Claude to analyze the reviews and find patterns
    const reviewTexts = reviews.map(r => `${r.rating}★: ${r.text?.substring(0, 100)}`).join('\n')
    console.log('Review count:', reviews.length, 'Text sample:', reviewTexts.substring(0, 200))
    
    let commonPraise = []
    let commonComplaints = []
    let areasToImprove = []
    let customerSuggestions = []
    let summary = ''
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
      summary: summary || `${storeName} has a ${details.rating} star rating based on ${details.user_ratings_total} Google reviews.`
    })

    if (reviews.length > 0) {
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
          messages: [{
            role: 'user',
            content: `Analyze these Google reviews for ${storeName}:

${reviewTexts}

Respond with ONLY this JSON:
{
  "commonPraise": ["what customers love 1", "what customers love 2", "what customers love 3"],
  "commonComplaints": ["common complaint 1", "common complaint 2", "common complaint 3"],
  "areasToImprove": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "customerSuggestions": ["specific thing customers have asked for 1", "specific thing customers have asked for 2"],
  "summary": "2 sentence summary of the store's reputation and what to improve"
}`
          }]
        })
      })

      const claudeData = await claudeRes.json()
      const text = claudeData.content?.filter(b => b.type === 'text')?.map(b => b.text)?.join('') || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        commonPraise = parsed.commonPraise || []
          commonComplaints = parsed.commonComplaints || []
          areasToImprove = parsed.areasToImprove || []
          customerSuggestions = parsed.customerSuggestions || []
          summary = parsed.summary || ''
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
      alertLevel,
      summary: summary || `${storeName} has a ${details.rating} star rating based on ${details.user_ratings_total} Google reviews.`
    })

  } catch (err) {
    console.error('Reviews error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}