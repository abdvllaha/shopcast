import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return Response.json({ error: err.message }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const getPlan = (priceId: string) => {
    if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) return 'growth'
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
    return 'starter'
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId = session.metadata?.userId
      const subscriptionId = session.subscription as string

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
        const priceId = subscription.items.data[0].price.id

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: session.customer,
          plan: getPlan(priceId),
          status: subscription.status,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
        }, { onConflict: 'user_id' })
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as any
      const userId = subscription.metadata?.userId
      const priceId = subscription.items.data[0].price.id

      if (userId) {
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          plan: getPlan(priceId),
          status: subscription.status,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
        }, { onConflict: 'user_id' })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any
      const userId = subscription.metadata?.userId

      if (userId) {
        await supabase.from('subscriptions').update({
          status: 'canceled'
        }).eq('user_id', userId)
      }
      break
    }
  }

  return Response.json({ received: true })
}