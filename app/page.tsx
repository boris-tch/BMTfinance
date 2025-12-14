'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()
  
  // Check if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/dashboard')
      }
    })
  }, [])
  
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,    
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) throw error
      
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
        <h1 className="text-3xl font-bold mb-2">BMT</h1>
        <p className="text-gray-600 mb-8">Login with Google</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            Error: {error}
          </div>
        )}
        
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>
        
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Make sure popups are allowed for Google login
          </p>
        </div>
      </div>
    </div>
  )
}