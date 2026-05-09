export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const accessToken = searchParams.get('accessToken')

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id,currency,account_status&access_token=${accessToken}`
    )
    const data = await res.json()
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}