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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="max-w-sm w-full p-8 bg-[#111111] border border-[#222222] rounded-xl text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#00ff8f] rounded-md"></div>
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight">BMT FINANCE</h1>
          </div>
          <p className="text-gray-400 text-sm font-light tracking-wide">PROFESSIONAL FINANCIAL TERMINAL</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-[#2a1a1a] border border-[#662222] text-[#ff6666] rounded text-sm font-mono">
            ERROR: {error}
          </div>
        )}
        
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#1a1a1a] border border-[#333333] text-gray-300 px-4 py-3 rounded-lg hover:bg-[#222222] hover:border-[#444444] disabled:opacity-50 transition-all duration-150 font-medium"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="tracking-wide">INITIALIZING...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="tracking-wide">AUTHENTICATE WITH GOOGLE</span>
            </>
          )}
        </button>
        
        <div className="mt-8 pt-6 border-t border-[#222222]">
          <p className="text-xs text-gray-500 font-mono tracking-wider">
            SYSTEM: BMT_TERMINAL v2.1 • REQUIRES GOOGLE AUTH
          </p>
        </div>
      </div>
    </div>
  )
}