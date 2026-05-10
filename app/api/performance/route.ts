import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const storeId = searchParams.get('storeId')

  if (!userId) {
    return Response.json({ message: 'No user ID provided' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let query = supabase
    .from('traffic_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(30)

  if (storeId) query = query.eq('store_id', storeId)

  const { data: logs } = await query

  if (!logs || logs.length === 0) {
    return Response.json({ message: 'No data yet' })
  }

  const slow = logs.filter(l => l.traffic_level === 'slow').length
  const normal = logs.filter(l => l.traffic_level === 'normal').length
  const busy = logs.filter(l => l.traffic_level === 'busy').length
  const total = logs.length

  const busyDays = logs.filter(l => l.traffic_level === 'busy').map(l => {
    const date = new Date(l.log_date + 'T12:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  })

  const dayCount: Record<string, number> = {}
  busyDays.forEach(day => { dayCount[day] = (dayCount[day] || 0) + 1 })
  const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Year-over-year comparison using sales history
  const today = new Date()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())
  const thisWeekEnd = new Date(thisWeekStart)
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6)

  const lastYearWeekStart = new Date(thisWeekStart)
  lastYearWeekStart.setFullYear(lastYearWeekStart.getFullYear() - 1)
  const lastYearWeekEnd = new Date(thisWeekEnd)
  lastYearWeekEnd.setFullYear(lastYearWeekEnd.getFullYear() - 1)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  let salesQuery = supabase
    .from('sales_history')
    .select('*')
    .eq('user_id', userId)

  if (storeId) salesQuery = salesQuery.eq('store_id', storeId)

  const { data: allSales } = await salesQuery

  let yoyData = null
  if (allSales && allSales.length > 0) {
    const thisWeekSales = allSales.filter(s => 
      s.sale_date >= formatDate(thisWeekStart) && s.sale_date <= formatDate(thisWeekEnd)
    )
    const lastYearSales = allSales.filter(s =>
      s.sale_date >= formatDate(lastYearWeekStart) && s.sale_date <= formatDate(lastYearWeekEnd)
    )

    const thisWeekTotal = thisWeekSales.reduce((sum, s) => sum + parseFloat(s.revenue), 0)
    const lastYearTotal = lastYearSales.reduce((sum, s) => sum + parseFloat(s.revenue), 0)

    if (lastYearTotal > 0) {
      const change = ((thisWeekTotal - lastYearTotal) / lastYearTotal) * 100
      yoyData = {
        thisWeek: thisWeekTotal,
        lastYear: lastYearTotal,
        changePercent: Math.round(change),
        isUp: change >= 0
      }
    }

    // Last 4 weeks vs same 4 weeks last year
    const fourWeeksAgo = new Date(today)
    fourWeeksAgo.setDate(today.getDate() - 28)
    const lastYearFourWeeksAgo = new Date(fourWeeksAgo)
    lastYearFourWeeksAgo.setFullYear(lastYearFourWeeksAgo.getFullYear() - 1)
    const lastYearToday = new Date(today)
    lastYearToday.setFullYear(lastYearToday.getFullYear() - 1)

    const recentSales = allSales.filter(s => s.sale_date >= formatDate(fourWeeksAgo))
    const lastYearRecentSales = allSales.filter(s =>
      s.sale_date >= formatDate(lastYearFourWeeksAgo) && s.sale_date <= formatDate(lastYearToday)
    )

    const recentTotal = recentSales.reduce((sum, s) => sum + parseFloat(s.revenue), 0)
    const lastYearRecentTotal = lastYearRecentSales.reduce((sum, s) => sum + parseFloat(s.revenue), 0)

    if (lastYearRecentTotal > 0 && yoyData) {
      const monthChange = ((recentTotal - lastYearRecentTotal) / lastYearRecentTotal) * 100
      yoyData.monthChangePercent = Math.round(monthChange)
      yoyData.monthIsUp = monthChange >= 0
      yoyData.recentTotal = recentTotal
      yoyData.lastYearRecentTotal = lastYearRecentTotal
    }
  }

  return Response.json({
    total, slow, normal, busy,
    slowPct: Math.round((slow / total) * 100),
    normalPct: Math.round((normal / total) * 100),
    busyPct: Math.round((busy / total) * 100),
    busiestDay,
    logs: logs.slice(0, 7),
    yoy: yoyData
  })
}