'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Settings() {
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [storeType, setStoreType] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [storeId, setStoreId] = useState('')
  const [userId, setUserId] = useState('')
  const [competitors, setCompetitors] = useState<any[]>([])
  const [newCompetitorName, setNewCompetitorName] = useState('')
  const [newCompetitorAddress, setNewCompetitorAddress] = useState('')
  const [newCompetitorCity, setNewCompetitorCity] = useState('')
  const [addingCompetitor, setAddingCompetitor] = useState(false)
  const [googleAdsConnected, setGoogleAdsConnected] = useState(false)
  const [savingAdsSettings, setSavingAdsSettings] = useState(false)
  const [minBudget, setMinBudget] = useState('10')
  const [maxBudget, setMaxBudget] = useState('100')
  const [metaAdsConnected, setMetaAdsConnected] = useState(false)
const [savingMetaSettings, setSavingMetaSettings] = useState(false)
const [metaMinBudget, setMetaMinBudget] = useState('10')
const [metaMaxBudget, setMetaMaxBudget] = useState('100')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      const { data: stores } = await supabase
        .from('stores').select('*').eq('user_id', session.user.id).single()
      if (stores) {
        setStoreName(stores.store_name)
        setAddress(stores.address)
        setCity(stores.city)
        setStoreType(stores.store_type)
        setStoreId(stores.id)
      }

      const { data: comps } = await supabase
        .from('competitors').select('*').eq('user_id', session.user.id)
      if (comps) setCompetitors(comps)

      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('google_ads_connected') === 'true') {
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        if (accessToken) {
          await supabase.from('google_ads_tokens').upsert({
            user_id: session.user.id,
            access_token: accessToken,
            refresh_token: refreshToken
          }, { onConflict: 'user_id' })
          setGoogleAdsConnected(true)
          window.history.replaceState({}, '', '/settings')
        }
      } else {
        const { data: adsToken } = await supabase
          .from('google_ads_tokens').select('*').eq('user_id', session.user.id).single()
        if (adsToken) {
          setGoogleAdsConnected(true)
          if (adsToken.min_budget) setMinBudget(adsToken.min_budget.toString())
          if (adsToken.max_budget) setMaxBudget(adsToken.max_budget.toString())
        }
      const { data: metaToken } = await supabase
        .from('meta_ads_tokens').select('*').eq('user_id', session.user.id).single()
      if (metaToken) {
        setMetaAdsConnected(true)
        if (metaToken.min_budget) setMetaMinBudget(metaToken.min_budget.toString())
        if (metaToken.max_budget) setMetaMaxBudget(metaToken.max_budget.toString())
      }

      // Check if Meta Ads just connected
      const metaConnected = urlParams.get('meta_ads_connected')
      const metaAccessToken = urlParams.get('access_token')
      if (metaConnected === 'true' && metaAccessToken) {
        await supabase.from('meta_ads_tokens').upsert({
          user_id: session.user.id,
          access_token: metaAccessToken
        }, { onConflict: 'user_id' })
        setMetaAdsConnected(true)
        window.history.replaceState({}, '', '/settings')
      }
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!storeName || !address || !city || !storeType) {
      setError('Please fill in all fields')
      return
    }
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { error } = await supabase.from('stores').update({
      store_name: storeName, address, city, store_type: storeType
    }).eq('user_id', session.user.id)
    if (error) setError(error.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  const addCompetitor = async () => {
    if (!newCompetitorName || !newCompetitorAddress || !newCompetitorCity) return
    if (competitors.length >= 5) { setError('Maximum 5 competitors allowed'); return }
    setAddingCompetitor(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('competitors').insert({
      user_id: userId, store_id: storeId,
      competitor_name: newCompetitorName,
      address: newCompetitorAddress,
      city: newCompetitorCity
    }).select().single()
    if (!error && data) {
      setCompetitors(prev => [...prev, data])
      setNewCompetitorName('')
      setNewCompetitorAddress('')
      setNewCompetitorCity('')
    }
    setAddingCompetitor(false)
  }

  const removeCompetitor = async (id: string) => {
    const supabase = createClient()
    await supabase.from('competitors').delete().eq('id', id)
    setCompetitors(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-blue-200 hover:text-white transition">
            ← Back to Dashboard
          </button>
        </div>

        {/* Store Settings */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl mb-6">
          <h1 className="text-2xl font-bold text-blue-900 mb-2">Store Settings</h1>
          <p className="text-gray-500 mb-6">Update your store details to improve your predictions</p>
          {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>}
          {saved && <div className="bg-green-50 text-green-600 rounded-lg p-3 mb-4 text-sm">✅ Settings saved successfully</div>}
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Store Name</label>
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Street Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Describe your store</label>
              <textarea value={storeType} onChange={e => setStoreType(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <p className="text-xs text-gray-400 mt-1">💡 Tip: Include your typical customer, busiest days, average sale size, and how weather affects your store.</p>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 mt-2">
              {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Competitors */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl mb-6">
          <h2 className="text-xl font-bold text-blue-900 mb-2">🏪 Competitors</h2>
          <p className="text-gray-500 mb-6">Add up to 5 competitors to track and compare traffic</p>
          {competitors.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              {competitors.map(comp => (
                <div key={comp.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{comp.competitor_name}</p>
                    <p className="text-gray-500 text-sm">{comp.address}, {comp.city}</p>
                  </div>
                  <button onClick={() => removeCompetitor(comp.id)}
                    className="text-red-400 hover:text-red-600 transition text-sm">Remove</button>
                </div>
              ))}
            </div>
          )}
          {competitors.length < 5 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-700">Add a competitor ({competitors.length}/5)</p>
              <input type="text" value={newCompetitorName} onChange={e => setNewCompetitorName(e.target.value)}
                placeholder="Competitor name (e.g. The Brick)"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={newCompetitorAddress} onChange={e => setNewCompetitorAddress(e.target.value)}
                placeholder="Street address"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={newCompetitorCity} onChange={e => setNewCompetitorCity(e.target.value)}
                placeholder="City"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addCompetitor} disabled={addingCompetitor || !newCompetitorName || !newCompetitorAddress || !newCompetitorCity}
                className="bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                {addingCompetitor ? 'Adding...' : '+ Add Competitor'}
              </button>
            </div>
          )}
          {competitors.length === 5 && (
            <p className="text-gray-500 text-sm text-center">Maximum 5 competitors reached</p>
          )}
        </div>

        {/* Google Ads */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl mb-6">
          <h2 className="text-xl font-bold text-blue-900 mb-2">🎯 Google Ads</h2>
          <p className="text-gray-500 mb-6">Connect your Google Ads account so ShopCast can automatically adjust your budget based on predicted traffic</p>
          {googleAdsConnected ? (
            <div>
              <div className="bg-green-50 rounded-xl p-4 mb-6 flex items-center gap-3">
                <span className="text-green-500 text-2xl">✅</span>
                <div>
                  <p className="text-green-800 font-medium">Google Ads Connected</p>
                  <p className="text-green-600 text-sm">ShopCast can now optimize your ad budget automatically</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 mb-6">
                <p className="text-sm font-medium text-gray-700">Set your daily budget limits:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Minimum daily budget ($)</label>
                    <input type="number" value={minBudget} onChange={e => setMinBudget(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Maximum daily budget ($)</label>
                    <input type="number" value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">ShopCast will never spend outside these limits. On high-traffic days it moves toward the max, on slow days toward the min.</p>
                <button onClick={async () => {
                  setSavingAdsSettings(true)
                  const supabase = createClient()
                  await supabase.from('google_ads_tokens').update({
                    min_budget: parseFloat(minBudget),
                    max_budget: parseFloat(maxBudget)
                  }).eq('user_id', userId)
                  setSavingAdsSettings(false)
                }} className="bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition">
                  {savingAdsSettings ? 'Saving...' : 'Save Budget Settings'}
                </button>
              </div>
              <button onClick={async () => {
                const supabase = createClient()
                await supabase.from('google_ads_tokens').delete().eq('user_id', userId)
                setGoogleAdsConnected(false)
              }} className="text-red-400 hover:text-red-600 text-sm transition">
                Disconnect Google Ads
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-blue-800 text-sm font-medium mb-2">How it works:</p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• High traffic predicted → budget increases toward your maximum</li>
                  <li>• Slow day predicted → budget reduces to your minimum</li>
                  <li>• You set the limits — ShopCast never exceeds them</li>
                </ul>
              </div>
              <a href="/api/google-ads/connect"
                className="block w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition text-center">
                🔗 Connect Google Ads Account
              </a>
            </div>
          )}
        </div>
       {/* Meta Ads */}
<div className="bg-white rounded-2xl p-8 shadow-2xl mb-6">
  <h2 className="text-xl font-bold text-blue-900 mb-2">📘 Facebook & Instagram Ads</h2>
  <p className="text-gray-500 mb-6">Connect your Meta Ads account so ShopCast can automatically adjust your Facebook and Instagram ad budget based on predicted traffic</p>
  {metaAdsConnected ? (
    <div>
      <div className="bg-green-50 rounded-xl p-4 mb-6 flex items-center gap-3">
        <span className="text-green-500 text-2xl">✅</span>
        <div>
          <p className="text-green-800 font-medium">Facebook & Instagram Ads Connected</p>
          <p className="text-green-600 text-sm">ShopCast can now optimize your Meta ad budget automatically</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 mb-6">
        <p className="text-sm font-medium text-gray-700">Set your daily budget limits:</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Minimum daily budget ($)</label>
            <input type="number" value={metaMinBudget} onChange={e => setMetaMinBudget(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Maximum daily budget ($)</label>
            <input type="number" value={metaMaxBudget} onChange={e => setMetaMaxBudget(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <p className="text-xs text-gray-400">ShopCast will never spend outside these limits.</p>
        <button onClick={async () => {
          setSavingMetaSettings(true)
          const supabase = createClient()
          await supabase.from('meta_ads_tokens').update({
            min_budget: parseFloat(metaMinBudget),
            max_budget: parseFloat(metaMaxBudget)
          }).eq('user_id', userId)
          setSavingMetaSettings(false)
        }} className="bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition">
          {savingMetaSettings ? 'Saving...' : 'Save Budget Settings'}
        </button>
      </div>
      <button onClick={async () => {
        const supabase = createClient()
        await supabase.from('meta_ads_tokens').delete().eq('user_id', userId)
        setMetaAdsConnected(false)
      }} className="text-red-400 hover:text-red-600 text-sm transition">
        Disconnect Facebook Ads
      </button>
    </div>
  ) : (
    <div>
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <p className="text-blue-800 text-sm font-medium mb-2">How it works:</p>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• High traffic predicted → Facebook/Instagram budget increases</li>
          <li>• Slow day predicted → budget reduces to save money</li>
          <li>• You set the limits — ShopCast never exceeds them</li>
        </ul>
      </div>
      <a href="/api/meta-ads/connect"
        className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-500 transition text-center">
        🔗 Connect Facebook & Instagram Ads
      </a>
    </div>
  )}
</div> 
{/* Add New Store */}
<div className="bg-white rounded-2xl p-8 shadow-2xl mb-6">
  <h2 className="text-xl font-bold text-blue-900 mb-2">🏪 Add Another Store</h2>
  <p className="text-gray-500 mb-6">Manage multiple locations from one account</p>
  <a href="/setup"
    className="block w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition text-center">
    + Add New Store Location
  </a>
</div>

      </div>
    </main>
  )
}