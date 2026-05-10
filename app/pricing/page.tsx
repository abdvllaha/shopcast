'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Starter',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
    description: 'Perfect for single-location retailers getting started with AI forecasting',
    color: 'blue',
    features: [
      '✅ AI weekly foot traffic forecast',
      '✅ 7-day weather integration',
      '✅ Local events tracking',
      '✅ Real-time road traffic',
      '✅ Daily check-in tracker',
      '✅ Store performance report',
      '✅ Monday morning email digest',
      '✅ AI Chat Assistant',
      '✅ Prediction accuracy score',
      '❌ Area demographics',
      '❌ Market trends & demand',
      '❌ Competitor analysis',
      '❌ Website & social scanner',
      '❌ Google Reviews monitoring',
      '❌ Marketing recommendations',
      '❌ Google & Meta Ads optimization',
      '❌ Multi-store support',
    ]
  },
  {
    name: 'Growth',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
    description: 'The complete retail intelligence platform for serious store owners',
    color: 'indigo',
    popular: true,
    features: [
      '✅ Everything in Starter',
      '✅ Area demographics & income data',
      '✅ Local market demand trends',
      '✅ Competitor tracking & analysis',
      '✅ Website & social media scanner',
      '✅ Google Reviews monitoring',
      '✅ Full marketing recommendations',
      '✅ Content calendar generator',
      '✅ Google Ads budget optimization',
      '✅ Meta Ads budget optimization',
      '✅ CSV sales & walk-in import',
      '✅ Year-over-year comparison',
      '❌ Multi-store support',
    ]
  },
  {
    name: 'Pro',
    price: 199,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    description: 'For retailers with multiple locations or franchise operations',
    color: 'purple',
    features: [
      '✅ Everything in Growth',
      '✅ Up to 5 store locations',
      '✅ Per-store analytics & forecasts',
      '✅ Per-store competitor tracking',
      '✅ Per-store ad optimization',
      '✅ Priority email support',
      '✅ Early access to new features',
    ]
  }
]

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setUser(session.user)
    }
    getUser()
  }, [])

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      router.push('/signup')
      return
    }

    setLoading(plan.name)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          email: user.email
        })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
    }
    setLoading(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 py-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="text-blue-300 hover:text-white transition text-sm mb-8 block">
            ← Back to ShopCast
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-blue-200 text-xl max-w-2xl mx-auto">
            Start your 14-day free trial today. No credit card required to start — cancel anytime.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium">
            🎉 14-day free trial on all plans
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative bg-white/10 rounded-2xl p-8 ${plan.popular ? 'ring-2 ring-white scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-900 text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h2 className="text-white text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-blue-300 text-sm mb-6">{plan.description}</p>
              <div className="mb-6">
                <span className="text-white text-5xl font-bold">${plan.price}</span>
                <span className="text-blue-300">/month</span>
              </div>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.name}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition mb-8 disabled:opacity-50 ${plan.popular ? 'bg-white text-blue-900 hover:bg-blue-50' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                {loading === plan.name ? 'Loading...' : 'Start Free Trial'}
              </button>
              <ul className="flex flex-col gap-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className={`text-sm ${feature.startsWith('✅') ? 'text-blue-100' : 'text-blue-400'}`}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-white text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { q: 'Do I need a credit card to start?', a: 'Yes — we require a card to start your free trial. You will not be charged until day 15. Cancel anytime before then.' },
              { q: 'Can I switch plans?', a: 'Yes — you can upgrade or downgrade at any time. Changes take effect immediately and are prorated.' },
              { q: 'What happens after the trial?', a: 'After 14 days your card is charged for the plan you selected. You\'ll receive an email reminder before the trial ends.' },
              { q: 'Can I cancel anytime?', a: 'Yes — cancel anytime from your account settings. No cancellation fees. Your access continues until the end of your billing period.' },
              { q: 'What stores is ShopCast best for?', a: 'ShopCast works best for single-location physical retailers doing $500K+ in annual revenue — furniture, clothing, home goods, sporting goods, and specialty retail.' },
              { q: 'Is my data secure?', a: 'Yes — all data is encrypted in transit and at rest. We never sell your data. See our Privacy Policy for full details.' },
            ].map((faq, i) => (
              <div key={i}>
                <p className="text-white font-semibold mb-2">{faq.q}</p>
                <p className="text-blue-200 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-blue-300 text-sm">
            Questions? Email us at{' '}
            <a href="mailto:hello@shopcast.ca" className="text-white hover:underline">hello@shopcast.ca</a>
          </p>
          <p className="text-blue-400 text-xs mt-2">
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            {' · '}
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          </p>
        </div>

      </div>
    </main>
  )
}