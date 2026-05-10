'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleReset = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Set new password</h1>
        <p className="text-gray-500 mb-6">Choose a strong password for your account</p>

        {success ? (
          <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm">
            ✅ Password updated successfully! Redirecting to dashboard...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min. 6 characters" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repeat your password" />
            </div>
            <button onClick={handleReset} disabled={loading || !password || !confirmPassword}
              className="bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}