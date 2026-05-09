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
  const [userId, setUserId] = useState('')
  const [todayLog, setTodayLog] = useState<string | null>(null)
  const [loggingTraffic, setLoggingTraffic] = useState(false)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [performance, setPerformance] = useState<any>(null)
  const [accuracy, setAccuracy] = useState<any>(null)
  const [salesHistory, setSalesHistory] = useState<any[]>([])
  const [roadTraffic, setRoadTraffic] = useState<any>(null)
  const [trends, setTrends] = useState<any>(null)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [demographics, setDemographics] = useState<any>(null)
  const [loadingDemographics, setLoadingDemographics] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState('')
  const [showSalesImport, setShowSalesImport] = useState(false)
  const [salesImporting, setSalesImporting] = useState(false)
  const [salesImportResult, setSalesImportResult] = useState('')
  const [showPastLog, setShowPastLog] = useState(false)
  const [pastDate, setPastDate] = useState('')
  const [pastLevel, setPastLevel] = useState('')
  const [pastSaved, setPastSaved] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [competitors, setCompetitors] = useState<any[]>([])
const [competitorAnalysis, setCompetitorAnalysis] = useState<any>(null)
const [loadingCompetitors, setLoadingCompetitors] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return }
        setUserEmail(session.user.email ?? '')
        setUserId(session.user.id)

        const { data: stores, error: storeError } = await supabase
          .from('stores').select('*').eq('user_id', session.user.id).single()
        if (storeError || !stores) { router.push('/setup'); return }
        setStore(stores)

        const today = new Date().toISOString().split('T')[0]
        const { data: todayData } = await supabase
          .from('traffic_logs').select('*').eq('user_id', session.user.id).eq('log_date', today).single()
        if (todayData) setTodayLog(todayData.traffic_level)

        const { data: logs } = await supabase
          .from('traffic_logs').select('*').eq('user_id', session.user.id)
          .order('log_date', { ascending: false }).limit(7)
        if (logs) setRecentLogs(logs)

        const { data: sales } = await supabase
          .from('sales_history').select('*').eq('user_id', session.user.id)
          .order('sale_date', { ascending: false }).limit(365)
        if (sales) setSalesHistory(sales)

        const perfRes = await fetch(`/api/performance?userId=${session.user.id}`)
        const perfData = await perfRes.json()
        if (perfData.total) setPerformance(perfData)

        const accRes = await fetch(`/api/accuracy?userId=${session.user.id}`)
        const accData = await accRes.json()
        if (accData.accuracy !== undefined) setAccuracy(accData)
          const { data: comps } = await supabase
          .from('competitors').select('*').eq('user_id', session.user.id)
        if (comps) setCompetitors(comps)

        const [weatherRes, eventsRes, trafficRes] = await Promise.all([
          fetch(`/api/weather?city=${encodeURIComponent(stores.city)}`),
          fetch(`/api/events?city=${encodeURIComponent(stores.city)}`),
          fetch(`/api/road-traffic?address=${encodeURIComponent(stores.address)}&city=${encodeURIComponent(stores.city)}`)
        ])

        const weatherData = await weatherRes.json()
        const eventsData = await eventsRes.json()
        const trafficData = await trafficRes.json()

        setWeather(weatherData)
        setEvents(eventsData.events || [])
        if (trafficData.trafficLevel) setRoadTraffic(trafficData)
        setLoading(false)
      } catch (err) {
        setError('Something went wrong loading your dashboard.')
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadTrends = async () => {
    setLoadingTrends(true)
    try {
      const res = await fetch(`/api/trends?storeType=${encodeURIComponent(store.store_type)}&city=${encodeURIComponent(store.city)}`)
      const data = await res.json()
      if (data.summary) setTrends(data)
    } catch (err) { console.error('Trends error:', err) }
    setLoadingTrends(false)
  }

  const loadDemographics = async () => {
    setLoadingDemographics(true)
    try {
      const res = await fetch(`/api/demographics?address=${encodeURIComponent(store.address)}&city=${encodeURIComponent(store.city)}`)
      const data = await res.json()
      if (data.incomeLevel) setDemographics(data)
    } catch (err) { console.error('Demographics error:', err) }
    setLoadingDemographics(false)
  }
  const loadCompetitorAnalysis = async () => {
    setLoadingCompetitors(true)
    try {
      const res = await fetch(`/api/competitor-analysis?userId=${userId}&store=${encodeURIComponent(JSON.stringify(store))}`)
      const data = await res.json()
      if (!data.error) setCompetitorAnalysis(data)
    } catch (err) { console.error('Competitor error:', err) }
    setLoadingCompetitors(false)
  }

  const logTraffic = async (level: string) => {
    setLoggingTraffic(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('traffic_logs').upsert({
      user_id: session.user.id, store_id: store.id, log_date: today, traffic_level: level
    }, { onConflict: 'user_id,log_date' })
    setTodayLog(level)
    setRecentLogs(prev => {
      const filtered = prev.filter(l => l.log_date !== today)
      return [{ log_date: today, traffic_level: level }, ...filtered].slice(0, 7)
    })
    setLoggingTraffic(false)
  }

  const getPrediction = async () => {
    setPredicting(true)
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store, weather, events, recentLogs, salesHistory, demographics })
      })
      const data = await res.json()
      if (data.error) {
        setPrediction('Error: ' + JSON.stringify(data.details))
      } else {
        setPrediction(data.prediction)
        if (data.predictions && data.predictions.length > 0) {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            await fetch('/api/accuracy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.user.id,
                storeId: store.id,
                predictions: data.predictions
              })
            })
            const accRes = await fetch(`/api/accuracy?userId=${session.user.id}`)
            const accData = await accRes.json()
            if (accData.accuracy !== undefined) setAccuracy(accData)
          }
        }
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

  const TRAFFIC_LEVELS = [
    { level: 'slow', emoji: '🔴', label: 'Slow' },
    { level: 'normal', emoji: '🟡', label: 'Normal' },
    { level: 'busy', emoji: '🟢', label: 'Busy' },
  ]

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

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">ShopCast</h1>
            <p className="text-blue-200">{store?.store_name} · {store?.city}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/settings')} className="text-blue-200 hover:text-white transition text-sm">⚙️ Settings</button>
            <button onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); router.push('/') }} className="text-blue-200 hover:text-white transition text-sm">Sign out</button>
          </div>
        </div>

        {/* Daily Check-in */}
        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-2">📊 How busy was your store today?</h2>
          <p className="text-blue-300 text-sm mb-4">Your check-ins help ShopCast learn your store's patterns over time</p>
          <div className="flex gap-3">
            {TRAFFIC_LEVELS.map(({ level, emoji, label }) => (
              <button key={level} onClick={() => logTraffic(level)} disabled={loggingTraffic}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${todayLog === level ? 'bg-white text-blue-900 scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {emoji} {label}
              </button>
            ))}
          </div>
          {todayLog && <p className="text-blue-300 text-sm mt-3">✅ Today logged as <strong className="text-white">{todayLog}</strong> — thanks!</p>}
          {recentLogs.length > 0 && (
            <div className="mt-4">
              <p className="text-blue-300 text-xs mb-2">Recent check-ins:</p>
              <div className="flex gap-2 flex-wrap">
                {recentLogs.map((log, i) => (
                  <div key={i} className="bg-white/10 rounded-lg px-3 py-1 text-xs text-blue-200">
                    {log.log_date} — {log.traffic_level === 'slow' ? '🔴' : log.traffic_level === 'normal' ? '🟡' : '🟢'} {log.traffic_level}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-white/20">
            <button onClick={() => setShowPastLog(!showPastLog)} className="text-blue-300 hover:text-white text-sm transition">
              {showPastLog ? '▲ Hide' : '▼ Log a past day'}
            </button>
            {showPastLog && (
              <div className="mt-3 flex gap-3 items-center flex-wrap">
                <input type="date" value={pastDate} onChange={e => setPastDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none" />
                <select value={pastLevel} onChange={e => setPastLevel(e.target.value)}
                  className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none">
                  <option value="">Select level</option>
                  <option value="slow">🔴 Slow</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="busy">🟢 Busy</option>
                </select>
                <button onClick={async () => {
                  if (!pastDate || !pastLevel) return
                  const supabase = createClient()
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session) return
                  await supabase.from('traffic_logs').upsert({
                    user_id: session.user.id, store_id: store.id, log_date: pastDate, traffic_level: pastLevel
                  }, { onConflict: 'user_id,log_date' })
                  setPastSaved(true)
                  setTimeout(() => setPastSaved(false), 2000)
                  setRecentLogs(prev => {
                    const filtered = prev.filter(l => l.log_date !== pastDate)
                    return [...filtered, { log_date: pastDate, traffic_level: pastLevel }]
                      .sort((a, b) => b.log_date.localeCompare(a.log_date)).slice(0, 7)
                  })
                }} className="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition">
                  {pastSaved ? '✅ Saved!' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Road Traffic */}
        {roadTraffic && (
          <div className="bg-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-bold text-lg mb-4">🚗 Street Traffic Near Your Store</h2>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${roadTraffic.trafficColor === 'green' ? 'bg-green-500' : roadTraffic.trafficColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}>🚗</div>
              <div>
                <p className="text-white text-xl font-bold">{roadTraffic.trafficLabel}</p>
                <p className="text-blue-200 text-sm">Current speed: {roadTraffic.currentSpeed} km/h vs normal {roadTraffic.freeFlowSpeed} km/h</p>
                <p className="text-blue-300 text-xs mt-1">Roads are at {roadTraffic.trafficRatio}% of normal flow</p>
              </div>
            </div>
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <p className="text-blue-200 text-sm">
                {roadTraffic.trafficColor === 'green' && '✅ Roads are clear — customers can easily reach your store right now'}
                {roadTraffic.trafficColor === 'yellow' && '⚠️ Moderate traffic — some customers may be delayed'}
                {roadTraffic.trafficColor === 'red' && '🔴 Heavy traffic nearby — foot traffic may be lower until roads clear'}
              </p>
            </div>
          </div>
        )}

        {/* Local Search Demand */}
        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold text-lg">📈 Local Search Demand</h2>
            <button onClick={loadTrends} disabled={loadingTrends}
              className="bg-white/20 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition disabled:opacity-50">
              {loadingTrends ? 'Loading...' : trends ? '🔄 Refresh' : 'Load Trends'}
            </button>
          </div>
          {trends ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${trends.signal === 'high' ? 'bg-green-500' : trends.signal === 'low' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                  {trends.emoji || '📊'}
                </div>
                <div>
                  <p className={`text-lg font-bold ${trends.signal === 'high' ? 'text-green-400' : trends.signal === 'low' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {trends.signal === 'high' ? '🔥 High Demand' : trends.signal === 'low' ? '📉 Low Demand' : '📊 Normal Demand'}
                  </p>
                  <p className="text-blue-200 text-sm mt-1">{trends.summary}</p>
                </div>
              </div>
              {(trends.economy || trends.seasonal || trends.social) && (
                <div className="grid grid-cols-1 gap-2 mt-4 mb-4">
                  {trends.economy && <div className="bg-white/10 rounded-lg p-3"><p className="text-blue-300 text-xs font-medium mb-1">🏦 Economy</p><p className="text-blue-100 text-sm">{trends.economy}</p></div>}
                  {trends.seasonal && <div className="bg-white/10 rounded-lg p-3"><p className="text-blue-300 text-xs font-medium mb-1">📅 Seasonal</p><p className="text-blue-100 text-sm">{trends.seasonal}</p></div>}
                  {trends.social && <div className="bg-white/10 rounded-lg p-3"><p className="text-blue-300 text-xs font-medium mb-1">📱 Social Buzz</p><p className="text-blue-100 text-sm">{trends.social}</p></div>}
                </div>
              )}
              {trends.headlines && trends.headlines.length > 0 && (
                <div className="mt-3">
                  <p className="text-blue-300 text-xs mb-2">Recent headlines:</p>
                  <div className="flex flex-col gap-2">
                    {trends.headlines.slice(0, 3).map((h: any, i: number) => (
                      <div key={i} className="bg-white/10 rounded-lg p-3">
                        <p className="text-white text-xs font-medium">{h.title}</p>
                        <p className="text-blue-300 text-xs mt-1">{h.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-blue-300 text-sm">Click "Load Trends" to see current market intelligence for your store type and city.</p>
          )}
        </div>

        {/* Area Demographics */}
        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold text-lg">👥 Area Demographics</h2>
            <button onClick={loadDemographics} disabled={loadingDemographics}
              className="bg-white/20 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition disabled:opacity-50">
              {loadingDemographics ? 'Loading...' : demographics ? '🔄 Refresh' : 'Load Demographics'}
            </button>
          </div>
          {demographics ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-blue-300 text-xs font-medium mb-1">💰 Median Household Income</p>
                  <p className="text-white text-2xl font-bold">${parseInt(demographics.medianIncome).toLocaleString()}</p>
                  <p className={`text-sm font-medium mt-1 ${demographics.incomeLevel === 'high' ? 'text-green-400' : demographics.incomeLevel === 'upper-middle' ? 'text-blue-300' : demographics.incomeLevel === 'middle' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {demographics.incomeLevel?.charAt(0).toUpperCase() + demographics.incomeLevel?.slice(1)} Income Area
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-blue-300 text-xs font-medium mb-1">🏘️ Neighbourhood</p>
                  <p className="text-blue-100 text-sm">{demographics.neighbourhood}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-white/10 rounded-lg p-3"><p className="text-blue-300 text-xs font-medium mb-1">🛍️ Customer Profile</p><p className="text-blue-100 text-sm">{demographics.customerProfile}</p></div>
                <div className="bg-white/10 rounded-lg p-3"><p className="text-blue-300 text-xs font-medium mb-1">📈 Retail Strategy</p><p className="text-blue-100 text-sm">{demographics.retailImplication}</p></div>
              </div>
            </>
          ) : (
            <p className="text-blue-300 text-sm">Click "Load Demographics" to see income and customer profile data for your store's area.</p>
          )}
        </div>
        {/* Competitor Analysis */}
{competitors.length > 0 && (
  <div className="bg-white/10 rounded-2xl p-6 mb-6">
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-white font-bold text-lg">🏪 Competitor Analysis</h2>
        <p className="text-blue-300 text-sm mt-1">Tracking {competitors.length} competitor{competitors.length > 1 ? 's' : ''}</p>
      </div>
      <button onClick={loadCompetitorAnalysis} disabled={loadingCompetitors}
        className="bg-white/20 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition disabled:opacity-50">
        {loadingCompetitors ? 'Analyzing...' : competitorAnalysis ? '🔄 Refresh' : 'Analyze'}
      </button>
    </div>

    {competitorAnalysis ? (
      <>
        {/* Traffic Comparison */}
        <div className="flex flex-col gap-2 mb-4">
          <p className="text-blue-300 text-xs font-medium">🚗 Current Road Traffic Comparison</p>
          <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
            <p className="text-white font-medium text-sm">📍 {store?.store_name} (You)</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              competitorAnalysis.myTraffic?.trafficColor === 'green' ? 'bg-green-500 text-white' :
              competitorAnalysis.myTraffic?.trafficColor === 'yellow' ? 'bg-yellow-500 text-white' :
              'bg-red-500 text-white'
            }`}>{competitorAnalysis.myTraffic?.trafficLabel || 'Unknown'}</span>
          </div>
          {competitorAnalysis.competitorTraffic?.map((comp: any, i: number) => (
            <div key={i} className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
              <p className="text-blue-200 text-sm">{comp.name}</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                comp.traffic?.trafficColor === 'green' ? 'bg-green-500 text-white' :
                comp.traffic?.trafficColor === 'yellow' ? 'bg-yellow-500 text-white' :
                comp.traffic?.trafficColor === 'red' ? 'bg-red-500 text-white' :
                'bg-gray-500 text-white'
              }`}>{comp.traffic?.trafficLabel || 'No data'}</span>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        {competitorAnalysis.summary && (
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <p className="text-blue-300 text-xs font-medium mb-2">🤖 AI Analysis</p>
            <p className="text-blue-100 text-sm">{competitorAnalysis.summary}</p>
          </div>
        )}

        {/* Opportunities */}
        {competitorAnalysis.opportunities?.length > 0 && (
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <p className="text-blue-300 text-xs font-medium mb-2">✅ Opportunities</p>
            <ul className="flex flex-col gap-1">
              {competitorAnalysis.opportunities.map((opp: string, i: number) => (
                <li key={i} className="text-blue-100 text-sm">• {opp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Threats */}
        {competitorAnalysis.threats?.length > 0 && (
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <p className="text-blue-300 text-xs font-medium mb-2">⚠️ Threats</p>
            <ul className="flex flex-col gap-1">
              {competitorAnalysis.threats.map((threat: string, i: number) => (
                <li key={i} className="text-blue-100 text-sm">• {threat}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Competitor News */}
        {competitorAnalysis.news?.length > 0 && (
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-blue-300 text-xs font-medium mb-2">📰 Competitor News</p>
            <div className="flex flex-col gap-2">
              {competitorAnalysis.news.map((item: any, i: number) => (
                <div key={i} className="bg-white/10 rounded-lg p-3">
                  <p className="text-white text-xs font-medium">{item.competitor}: {item.headline}</p>
                  <p className="text-blue-300 text-xs mt-1">💡 {item.implication}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    ) : (
      <p className="text-blue-300 text-sm">Click "Analyze" to see how your traffic compares to competitors and get strategic recommendations.</p>
    )}
  </div>
)}

        {/* Prediction Accuracy */}
        {accuracy && (
          <div className="bg-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-bold text-lg mb-4">🎯 Prediction Accuracy</h2>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <p className={`text-5xl font-bold ${accuracy.accuracy >= 70 ? 'text-green-400' : accuracy.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {accuracy.accuracy}%
                </p>
                <p className="text-blue-200 text-sm mt-1">Accuracy Score</p>
              </div>
              <div className="flex-1">
                <div className="bg-white/10 rounded-full h-4 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${accuracy.accuracy >= 70 ? 'bg-green-400' : accuracy.accuracy >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${accuracy.accuracy}%` }} />
                </div>
                <p className="text-blue-300 text-xs mt-2">{accuracy.correct} correct out of {accuracy.total} predictions</p>
              </div>
            </div>
            {accuracy.matches && accuracy.matches.length > 0 && (
              <div>
                <p className="text-blue-300 text-xs mb-2">Recent predictions:</p>
                <div className="flex flex-col gap-1">
                  {accuracy.matches.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2">
                      <p className="text-blue-200 text-xs">{m.date}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-300 text-xs">Predicted: {m.predicted}</span>
                        <span className="text-blue-300 text-xs">→</span>
                        <span className="text-blue-300 text-xs">Actual: {m.actual}</span>
                        <span>{m.correct ? '✅' : '❌'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Report */}
        {performance && (
          <div className="bg-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-bold text-lg mb-4">📊 Your Store Performance</h2>
            <p className="text-blue-300 text-sm mb-4">Based on your last {performance.total} check-ins</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-green-400">{performance.busyPct}%</p><p className="text-blue-200 text-sm mt-1">🟢 Busy Days</p></div>
              <div className="bg-white/10 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-yellow-400">{performance.normalPct}%</p><p className="text-blue-200 text-sm mt-1">🟡 Normal Days</p></div>
              <div className="bg-white/10 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-red-400">{performance.slowPct}%</p><p className="text-blue-200 text-sm mt-1">🔴 Slow Days</p></div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-200 text-sm">📅 Your busiest day of the week: <strong className="text-white">{performance.busiestDay}</strong></p>
            </div>
          </div>
        )}

        {/* CSV Import */}
        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white font-bold text-lg">📂 Import Walk-in Data</h2>
              <p className="text-blue-300 text-sm mt-1">Upload a CSV with your historical walk-in counts</p>
            </div>
            <button onClick={() => setShowImport(!showImport)} className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/30 transition">
              {showImport ? 'Hide' : 'Upload CSV'}
            </button>
          </div>
          {showImport && (
            <div className="mt-4">
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <p className="text-blue-200 text-sm font-medium mb-2">📋 Required CSV format:</p>
                <code className="text-green-300 text-xs">date,walkins<br/>2026-05-01,23<br/>2026-05-02,18</code>
              </div>
              <input type="file" accept=".csv" onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setImporting(true)
                setImportResult('')
                const csvText = await file.text()
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return
                const res = await fetch('/api/import-walkins', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ csvText, userId: session.user.id, storeId: store.id })
                })
                const data = await res.json()
                setImportResult(data.success ? `✅ Imported ${data.imported} days of walk-in data!` : `❌ Error: ${data.error}`)
                setImporting(false)
              }} className="block w-full text-blue-200 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-blue-900 file:font-semibold hover:file:bg-blue-50 cursor-pointer" />
              {importing && <p className="text-blue-300 text-sm mt-3">Importing...</p>}
              {importResult && <p className="text-blue-100 text-sm mt-3">{importResult}</p>}
            </div>
          )}
        </div>

        {/* Sales History Import */}
        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white font-bold text-lg">💰 Import Previous Year Sales</h2>
              <p className="text-blue-300 text-sm mt-1">Upload last year's daily sales to improve revenue predictions</p>
            </div>
            <button onClick={() => setShowSalesImport(!showSalesImport)} className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/30 transition">
              {showSalesImport ? 'Hide' : 'Upload CSV'}
            </button>
          </div>
          {showSalesImport && (
            <div className="mt-4">
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <p className="text-blue-200 text-sm font-medium mb-2">📋 Required CSV format:</p>
                <code className="text-green-300 text-xs">date,revenue<br/>2025-05-01,2450.00<br/>2025-05-02,1820.50</code>
              </div>
              <input type="file" accept=".csv" onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setSalesImporting(true)
                setSalesImportResult('')
                const csvText = await file.text()
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return
                const res = await fetch('/api/import-sales', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ csvText, userId: session.user.id, storeId: store.id })
                })
                const data = await res.json()
                setSalesImportResult(data.success ? `✅ Imported ${data.imported} days of sales data!` : `❌ Error: ${data.error}`)
                setSalesImporting(false)
              }} className="block w-full text-blue-200 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-blue-900 file:font-semibold hover:file:bg-blue-50 cursor-pointer" />
              {salesImporting && <p className="text-blue-300 text-sm mt-3">Importing...</p>}
              {salesImportResult && <p className="text-blue-100 text-sm mt-3">{salesImportResult}</p>}
            </div>
          )}
        </div>

        {/* Weather */}
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

        {/* Events */}
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

        {/* AI Prediction */}
        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold text-lg">🤖 AI Traffic Prediction</h2>
            <button onClick={getPrediction} disabled={predicting}
              className="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition disabled:opacity-50">
              {predicting ? 'Analyzing...' : 'Generate Forecast'}
            </button>
          </div>
          {prediction ? (
            <>
              <div className="text-blue-100 leading-relaxed space-y-2">
                <ReactMarkdown components={{
                  h1: ({children}) => <h1 className="text-white text-xl font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({children}) => <h2 className="text-white text-lg font-bold mt-4 mb-2">{children}</h2>,
                  h3: ({children}) => <h3 className="text-white font-bold mt-3 mb-1">{children}</h3>,
                  strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
                  p: ({children}) => <p className="text-blue-100 mb-2">{children}</p>,
                  li: ({children}) => <li className="text-blue-100 ml-4 list-disc">{children}</li>,
                  ul: ({children}) => <ul className="mb-3 space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="mb-3 space-y-1 list-decimal ml-4">{children}</ol>,
                  table: ({children}) => <div className="overflow-x-auto mb-4"><table className="w-full border-collapse">{children}</table></div>,
                  thead: ({children}) => <thead className="bg-white/20">{children}</thead>,
                  tbody: ({children}) => <tbody className="divide-y divide-white/10">{children}</tbody>,
                  th: ({children}) => <th className="text-white font-bold p-3 text-left text-sm whitespace-nowrap">{children}</th>,
                  td: ({children}) => <td className="text-blue-200 p-3 text-sm border-t border-white/10">{children}</td>,
                  tr: ({children}) => <tr className="hover:bg-white/5 transition">{children}</tr>,
                  hr: () => <hr className="border-white/20 my-3" />,
                }}>{prediction}</ReactMarkdown>
              </div>
              <div className="flex gap-3 pt-4 mt-4 border-t border-white/20">
                <button onClick={sendEmail} disabled={sending}
                  className="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition disabled:opacity-50">
                  {emailSent ? '✅ Sent!' : sending ? 'Sending...' : '📧 Email Forecast'}
                </button>
                <button onClick={exportText} className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/30 transition">
                  📄 Download Forecast
                </button>
              </div>
            </>
          ) : (
            <p className="text-blue-300">Click "Generate Forecast" to get your AI-powered weekly prediction and staffing recommendations.</p>
          )}
        </div>

        {/* AI Chat */}
        <div className="bg-white/10 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-2">💬 Ask ShopCast AI</h2>
          <p className="text-blue-300 text-sm mb-4">Ask anything about your store — staffing, promotions, pricing, strategy</p>
          <div className="flex flex-col gap-2 mb-4 max-h-80 overflow-y-auto">
            {chatMessages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {['Should I run a sale this Friday?', 'How many staff do I need this weekend?', 'What promotions should I run this week?', 'Is this a good week to launch a new product?'].map(q => (
                  <button key={q} onClick={() => setChatInput(q)}
                    className="bg-white/10 text-blue-200 px-3 py-2 rounded-lg text-xs hover:bg-white/20 transition text-left">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-white/20 text-white ml-8' : 'bg-white/10 text-blue-100 mr-8'}`}>
                {msg.role === 'assistant' && <p className="text-blue-400 text-xs font-medium mb-1">ShopCast AI</p>}
                {msg.role === 'assistant' ? (
                  <ReactMarkdown components={{
                    strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
                    p: ({children}) => <span>{children}</span>,
                    ul: ({children}) => <ul className="list-disc ml-4 mt-1">{children}</ul>,
                    li: ({children}) => <li className="mb-1">{children}</li>,
                  }}>{msg.content}</ReactMarkdown>
                ) : msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-white/10 rounded-xl p-3 mr-8">
                <p className="text-blue-400 text-xs font-medium mb-1">ShopCast AI</p>
                <p className="text-blue-300 text-sm">Thinking...</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter' && chatInput.trim() && !chatLoading) {
                  const userMessage = chatInput.trim()
                  setChatInput('')
                  setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
                  setChatLoading(true)
                  const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage, store, weather, events, recentLogs, salesHistory, demographics, chatHistory: chatMessages })
                  })
                  const data = await res.json()
                  setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
                  setChatLoading(false)
                }
              }}
              placeholder="Ask anything about your store..."
              className="flex-1 bg-white/10 text-white rounded-lg px-4 py-3 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-blue-300" />
            <button onClick={async () => {
              if (!chatInput.trim() || chatLoading) return
              const userMessage = chatInput.trim()
              setChatInput('')
              setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
              setChatLoading(true)
              const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, store, weather, events, recentLogs, salesHistory, demographics, chatHistory: chatMessages })
              })
              const data = await res.json()
              setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
              setChatLoading(false)
            }} disabled={chatLoading || !chatInput.trim()}
              className="bg-white text-blue-900 px-4 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition disabled:opacity-50">
              Send
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}