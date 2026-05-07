export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')

  const apiKey = process.env.TICKETMASTER_API_KEY

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(city)}&size=10&sort=date,asc&apikey=${apiKey}`
  )
  const data = await res.json()

  const events = data._embedded?.events?.map(event => ({
    name: event.name,
    date: event.dates.start.localDate,
    venue: event._embedded?.venues?.[0]?.name,
    type: event.classifications?.[0]?.segment?.name
  })) || []

  return Response.json({ events })
}