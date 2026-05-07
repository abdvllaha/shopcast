export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')

  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  )
  const geoData = await geoRes.json()

  if (!geoData.results || geoData.results.length === 0) {
    return Response.json({ error: 'City not found' }, { status: 404 })
  }

  const { latitude, longitude } = geoData.results[0]

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`
  )
  const weatherData = await weatherRes.json()

  return Response.json(weatherData)
}