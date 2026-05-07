'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

const WEATHER_CODES: Record<number, string> = {
  0: '☀️ Clear', 1: '🌤️ Mainly Clear', 2: '⛅ Partly Cloudy', 3: '☁️ Overcast',
  45: '🌫️ Foggy', 48: '🌫️ Foggy', 51: '🌦️ Light Drizzle', 53: '🌦️ Drizzle',
  55: '🌧️ Heavy Drizzle', 61: '🌧️ Light Rain', 63: '🌧️ Rain', 65: '🌧️ Heavy Rain',
  71: '🌨️ Light Snow', 73: '🌨️ Snow', 75: '❄️ Heavy Snow', 80: '🌦️ Showers',
  81: '🌧️ Heavy Showers', 82: '⛈️ Violent Showers', 95: '⛈️ Thunderstorm'
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard() {
  const [store, setStore] = useState<any>(null)
  const [weather, setWeather] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [prediction, setPrediction] = useState('')
  const [predicting, setPredicting] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return }
        setUserEmail(session.user.email ?? '')
        const { data: stores, error: storeError } = await supabase
          .from('stores').select('*').eq('user_id', session.user.id).single()
        if (storeError || !stores) { router.push('/setup'); return }
        setStore(stores)
        const [weatherRes, eventsRes] = await Promise.all([
          fetch(`/api/weather?city=${encodeURIComponent(stores.city)}`),
          fetch(`/api/events?city=${encodeURIComponent(stores.city)}`)
        ])
        const weatherData = await weatherRes.json()
        const eventsData = await eventsRes.json()
        setWeather(weatherData)
        setEvents(eventsData.events || [])
        setLoading(false)
      } catch (err) {
        setError('Something went wrong loading your dashboard.')
        setLoading(false)
      }
    }
    load()
  }, [])

  const getPrediction = async () => {
    setPredicting(true)
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store, weather, events })
      })
      const data = await res.json()
      if (data.error) {
        setPrediction('Error: ' + JSON.stringify(data.details))
      } else {
        setPrediction(data.prediction)
      }
    } catch (err: any) {
      setPrediction('Error: ' + err.message)
    }
    setPredicting(false)
  }

  const sendEmail = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/send-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store, prediction, email: userEmail })
      })
      const data = await res.json()
      if (data.success) { setEmailSent(true); setTimeout(() => setEmailSent(false), 3000) }
    } catch (err) { console.error('Email error:', err) }
    setSending(false)
  }

  const exportText = () => {
    const content = `SHOPCAST WEEKLY FORECAST\n${store.store_name} · ${store.city}\nGenerated: ${new Date().toLocaleDateString()}\n\n${prediction}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopcast-forecast-${store.store_name.replace(/\s+/g, '-')}.txt`
    a.click()
  }

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading your forecast...</div>
    </main>
  )

  if (error) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">{error}</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">ShopCast</h1>
            <p className="text-blue-200">{store?.store_name} · {store?.city}</p>
          </div>
          <button
            onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); router.push('/') }}
            className="text-blue-200 hover:text-white transition text-sm"
          >Sign out</button>
        </div>

        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">📅 7-Day Weather Forecast</h2>
          <div className="grid grid-cols-7 gap-2">
            {weather?.daily?.time?.map((date: string, i: number) => {
              const day = new Date(date)
              const code = weather.daily.weathercode[i]
              const max = Math.round(weather.daily.temperature_2m_max[i])
              const min = Math.round(weather.daily.temperature_2m_min[i])
              const rain = weather.daily.precipitation_sum[i]
              return (
                <div key={date} className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-blue-200 text-xs font-medium">{DAYS[day.getDay()]}</p>
                  <p className="text-2xl my-1">{WEATHER_CODES[code]?.split(' ')[0] || '🌡️'}</p>
                  <p className="text-white text-sm font-bold">{max}°</p>
                  <p className="text-blue-300 text-xs">{min}°</p>
                  {rain > 0 && <p className="text-blue-300 text-xs mt-1">💧{rain}mm</p>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">🎪 Upcoming Local Events</h2>
          {events.length === 0 ? (
            <p className="text-blue-200">No upcoming events found in {store?.city}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((event: any, i: number) => (
                <div key={i} className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{event.name}</p>
                    <p className="text-blue-200 text-sm">{event.venue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{event.date}</p>
                    <p className="text-blue-300 text-xs">{event.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold text-lg">🤖 AI Traffic Prediction</h2>
            <button
              onClick={getPrediction}
              disabled={predicting}
              className="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition disabled:opacity-50"
            >
              {predicting ? 'Analyzing...' : 'Generate Forecast'}
            </button>
          </div>
          {prediction ? (
            <>
              <div className="prose prose-invert max-w-none text-blue-100 prose-headings:text-white prose-headings:font-bold prose-strong:text-white prose-p:text-blue-100 prose-li:text-blue-100">
                <ReactMarkdown>{prediction}</ReactMarkdown>
              </div>
              <div className="flex gap-3 pt-4 mt-4 border-t border-white/20">
                <button
                  onClick={sendEmail}
                  disabled={sending}
                  className="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition disabled:opacity-50"
                >
                  {emailSent ? '✅ Sent!' : sending ? 'Sending...' : '📧 Email Forecast'}
                </button>
                <button
                  onClick={exportText}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/30 transition"
                >
                  📄 Download Forecast
                </button>
              </div>
            </>
          ) : (
            <p className="text-blue-300">Click "Generate Forecast" to get your AI-powered weekly prediction and staffing recommendations.</p>
          )}
        </div>

      </div>
    </main>
  )
}