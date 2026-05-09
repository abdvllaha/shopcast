import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_ads_failed`)
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google-ads/callback`
    
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_ads_failed`)
    }

    // Store tokens in Supabase - we'll add a google_ads_tokens table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Store in URL params temporarily to pass to frontend
    const params = new URLSearchParams({
      google_ads_connected: 'true',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || ''
    })

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?${params.toString()}`)
  } catch (err) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_ads_failed`)
  }
}