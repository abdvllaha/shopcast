import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { data: stores } = await supabase
    .from('stores')
    .select('*')

  if (!stores || stores.length === 0) {
    return Response.json({ message: 'No stores found' })
  }

  const results = []

  for (const store of stores) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(store.user_id)
      const email = userData?.user?.email
      if (!email) continue

      const [weatherRes, eventsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/weather?city=${encodeURIComponent(store.city)}`),
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events?city=${encodeURIComponent(store.city)}`)
      ])

      const weather = await weatherRes.json()
      const eventsData = await eventsRes.json()
      const events = eventsData.events || []

      const { data: recentLogs } = await supabase
        .from('traffic_logs')
        .select('*')
        .eq('user_id', store.user_id)
        .order('log_date', { ascending: false })
        .limit(7)

      const predictRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store, weather, events, recentLogs: recentLogs || [] })
      })

      const predictData = await predictRes.json()
      const prediction = predictData.prediction

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store, prediction, email })
      })

      results.push({ store: store.store_name, status: 'sent' })
    } catch (err) {
      results.push({ store: store.store_name, status: 'error', error: err.message })
    }
  }

  return Response.json({ success: true, results })
}