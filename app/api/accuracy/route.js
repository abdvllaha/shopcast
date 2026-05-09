import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const storeId = searchParams.get('storeId')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  let predQuery = supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .order('prediction_date', { ascending: false })
    .limit(30)

  let logQuery = supabase
    .from('traffic_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(30)

  if (storeId) {
    predQuery = predQuery.eq('store_id', storeId)
    logQuery = logQuery.eq('store_id', storeId)
  }

  const { data: predictions } = await predQuery
  const { data: logs } = await logQuery

  if (!predictions || !logs || predictions.length === 0 || logs.length === 0) {
    return Response.json({ message: 'Not enough data yet' })
  }

  const matches = []
  for (const prediction of predictions) {
    const actual = logs.find(l => l.log_date === prediction.prediction_date)
    if (actual) {
      matches.push({
        date: prediction.prediction_date,
        predicted: prediction.predicted_level,
        actual: actual.traffic_level,
        correct: prediction.predicted_level === actual.traffic_level
      })
    }
  }

  if (matches.length === 0) {
    return Response.json({ message: 'Not enough matching data yet' })
  }

  const correct = matches.filter(m => m.correct).length
  const accuracy = Math.round((correct / matches.length) * 100)

  return Response.json({ accuracy, total: matches.length, correct, matches: matches.slice(0, 7) })
}

export async function POST(request) {
  try {
    const { userId, storeId, predictions } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const rows = predictions.map(p => ({
      user_id: userId,
      store_id: storeId,
      prediction_date: p.date,
      predicted_level: p.level
    }))

    const { error } = await supabase
      .from('predictions')
      .upsert(rows, { onConflict: 'user_id,prediction_date' })

    if (error) {
      console.error('Accuracy save error:', error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, saved: rows.length })
  } catch (err) {
    console.error('Accuracy POST error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}