'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ExchangePage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const exchangeCode = async () => {
      const code = searchParams.get('code')
      
      if (!code) {
        console.error('No code found in URL')
        router.push('/?error=missing_code')
        return
      }
      
      console.log('Exchanging code for session...')
      
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Exchange error:', error)
          router.push(`/?error=${encodeURIComponent(error.message)}`)
          return
        }
        
        console.log('✅ Code exchanged successfully!')
        
        // Get user to confirm
        const { data: { user } } = await supabase.auth.getUser()
        console.log('User after exchange:', user?.email)
        
        // Redirect to dashboard
        router.push('/dashboard')
        
      } catch (error: any) {
        console.error('Exception during exchange:', error)
        router.push(`/?error=${encodeURIComponent(error.message)}`)
      }
    }
    
    exchangeCode()
  }, [])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Completing Google login...</p>
        <p className="text-sm text-gray-500 mt-2">Exchanging authorization code</p>
      </div>
    </div>
  )
}