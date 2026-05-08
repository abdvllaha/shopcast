import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { csvText, userId, storeId } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const lines = csvText.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())

    const dateIndex = headers.indexOf('date')
    const walkinsIndex = headers.indexOf('walkins')

    if (dateIndex === -1 || walkinsIndex === -1) {
      return Response.json({ 
        error: 'CSV must have "date" and "walkins" columns' 
      }, { status: 400 })
    }

    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      if (cols.length < 2) continue
      const date = cols[dateIndex]
      const count = parseInt(cols[walkinsIndex])
      if (!date || isNaN(count)) continue
      rows.push({
        user_id: userId,
        store_id: storeId,
        walkin_date: date,
        count
      })
    }

    if (rows.length === 0) {
      return Response.json({ error: 'No valid rows found in CSV' }, { status: 400 })
    }

    const { error } = await supabase
      .from('walkins')
      .upsert(rows, { onConflict: 'user_id,walkin_date' })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, imported: rows.length })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}