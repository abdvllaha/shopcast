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
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (stores) {
        setStoreName(stores.store_name)
        setAddress(stores.address)
        setCity(stores.city)
        setStoreType(stores.store_type)
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

    const { error } = await supabase
      .from('stores')
      .update({
        store_name: storeName,
        address,
        city,
        store_type: storeType
      })
      .eq('user_id', session.user.id)

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-200 hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-blue-900 mb-2">Store Settings</h1>
          <p className="text-gray-500 mb-6">Update your store details to improve your predictions</p>

          {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>}
          {saved && <div className="bg-green-50 text-green-600 rounded-lg p-3 mb-4 text-sm">✅ Settings saved successfully</div>}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Describe your store</label>
              <textarea
                value={storeType}
                onChange={e => setStoreType(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">💡 Tip: Include your typical customer, busiest days, average sale size, and how weather affects your store. e.g. "Women's clothing boutique, busy Fri-Sat, average sale $85, rain hurts foot traffic"</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 mt-2"
            >
              {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}