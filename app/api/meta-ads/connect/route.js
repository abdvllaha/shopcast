export async function GET(request) {
  const appId = process.env.META_ADS_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta-ads/callback`
  const scope = 'ads_management,ads_read,business_management'
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`
  
  return Response.redirect(authUrl)
}