export async function POST(request) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return Response.json({ error: 'Email not configured' }, { status: 500 })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(resendKey)
  const { store, prediction, email } = await request.json()

  try {
    await resend.emails.send({
      from: 'ShopCast <onboarding@resend.dev>',
      to: email,
      subject: `📊 Your Weekly ShopCast Forecast — ${store.store_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #3730a3); padding: 30px; border-radius: 12px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ShopCast</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0 0;">Weekly Forecast for ${store.store_name}</p>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">📍 ${store.store_name} · ${store.city}</h2>
            <p style="color: #64748b;">Store Type: ${store.store_type}</p>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">🤖 Your AI Weekly Forecast</h2>
            <pre style="white-space: pre-wrap; font-family: sans-serif; color: #334155; line-height: 1.6;">${prediction}</pre>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            Powered by ShopCast · AI-powered foot traffic forecasting for small retailers
          </p>
        </div>
      `
    })
    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Email error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}