export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city = searchParams.get('city')
  const apiKey = process.env.TOMTOM_API_KEY

  try {
    // First geocode the address to get coordinates
    const geoRes = await fetch(
      `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address + ' ' + city)}.json?key=${apiKey}`
    )
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) {
      return Response.json({ error: 'Address not found' }, { status: 404 })
    }

    const { lat, lon } = geoData.results[0].position

    // Get traffic flow data for that location
    const trafficRes = await fetch(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${apiKey}`
    )
    const trafficData = await trafficRes.json()

    if (!trafficData.flowSegmentData) {
      return Response.json({ error: 'No traffic data available' }, { status: 404 })
    }

    const { currentSpeed, freeFlowSpeed } = trafficData.flowSegmentData
    const trafficRatio = currentSpeed / freeFlowSpeed
    
    let trafficLevel
    let trafficLabel
    let trafficColor

    if (trafficRatio >= 0.8) {
      trafficLevel = 'free'
      trafficLabel = 'Free Flowing'
      trafficColor = 'green'
    } else if (trafficRatio >= 0.5) {
      trafficLevel = 'moderate'
      trafficLabel = 'Moderate Traffic'
      trafficColor = 'yellow'
    } else {
      trafficLevel = 'heavy'
      trafficLabel = 'Heavy Traffic'
      trafficColor = 'red'
    }

    return Response.json({
      trafficLevel,
      trafficLabel,
      trafficColor,
      currentSpeed: Math.round(currentSpeed),
      freeFlowSpeed: Math.round(freeFlowSpeed),
      trafficRatio: Math.round(trafficRatio * 100),
      lat,
      lon
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}