// app/dashboard/page.tsx - UPDATED
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const handleAuth = async () => {
      // Check URL for tokens (from Supabase redirect)
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const code = searchParams.get('code')
      
      console.log('Dashboard auth check:', { accessToken, refreshToken, code })
      
      if (accessToken && refreshToken) {
        setMessage('Setting session from URL tokens...')
        // Supabase should handle this automatically with detectSessionInUrl
        // Clear tokens from URL
        router.replace('/dashboard')
      }
      
      if (code) {
        setMessage('Exchanging code for session...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage('Code exchanged!')
          router.replace('/dashboard')
        }
      }
      
      // Check current auth state
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)
      
      setUser(user)
      
      if (!user) {
        setMessage('Not authenticated')
        // Optional: redirect after delay
        // setTimeout(() => router.push('/'), 2000)
      } else {
        setMessage(`Welcome ${user.email}!`)
      }
    }
    
    handleAuth()
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {user ? (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-green-600 mb-4">✅ Logged in as: {user.email}</p>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-red-600 mb-4">❌ Not logged in</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}