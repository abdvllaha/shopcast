import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: logs } = await supabase
    .from('traffic_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(30)

  if (!logs || logs.length === 0) {
    return Response.json({ message: 'No data yet' })
  }

  const slow = logs.filter(l => l.traffic_level === 'slow').length
  const normal = logs.filter(l => l.traffic_level === 'normal').length
  const busy = logs.filter(l => l.traffic_level === 'busy').length
  const total = logs.length

  const busyDays = logs.filter(l => l.traffic_level === 'busy').map(l => {
    const date = new Date(l.log_date)
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  })

  const dayCount = {}
  busyDays.forEach(day => { dayCount[day] = (dayCount[day] || 0) + 1 })
  const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  return Response.json({
    total,
    slow,
    normal,
    busy,
    slowPct: Math.round((slow / total) * 100),
    normalPct: Math.round((normal / total) * 100),
    busyPct: Math.round((busy / total) * 100),
    busiestDay,
    logs: logs.slice(0, 7)
  })
}