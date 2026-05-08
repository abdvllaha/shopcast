'use client'
import { useState } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Setup() {
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [storeType, setStoreType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSetup = async () => {
    if (!storeName || !address || !city || !storeType) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('stores').insert({
      user_id: user.id,
      store_name: storeName,
      address,
      city,
      store_type: storeType
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Set up your store</h1>
        <p className="text-gray-500 mb-6">Tell us about your store so we can start predicting your foot traffic</p>

        {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Main Street Boutique"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 123 Main Street"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Ottawa"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Describe your store</label>
            <textarea
              value={storeType}
              onChange={e => setStoreType(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="e.g. Women's clothing boutique focused on local designers, sizes 0-20"
            />
            <p className="text-xs text-gray-400 mt-1">💡 Tip: Include your typical customer, busiest days, average sale size, and how weather affects your store. e.g. "Women's clothing boutique, busy Fri-Sat, average sale $85, rain hurts foot traffic"</p>
          </div>

          <button
            onClick={handleSetup}
            disabled={loading}
            className="bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Saving...' : 'Continue to Dashboard →'}
          </button>
        </div>
      </div>
    </main>
  )
}