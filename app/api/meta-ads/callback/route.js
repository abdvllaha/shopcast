export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=meta_ads_failed`)
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta-ads/callback`
    
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.META_ADS_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.META_ADS_APP_SECRET}&code=${code}`
    )

    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=meta_ads_failed`)
    }

    // Get long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_ADS_APP_ID}&client_secret=${process.env.META_ADS_APP_SECRET}&fb_exchange_token=${tokens.access_token}`
    )
    const longToken = await longTokenRes.json()

    const finalToken = longToken.access_token || tokens.access_token

    const params = new URLSearchParams({
      meta_ads_connected: 'true',
      access_token: finalToken
    })

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?${params.toString()}`)
  } catch (err) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=meta_ads_failed`)
  }
}