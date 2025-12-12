'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [debug, setDebug] = useState<string[]>([])
  const supabase = createClient()
  const router = useRouter()
  
  const addDebug = (msg: string) => {
    setDebug(prev => [...prev, `${new Date().toISOString()}: ${msg}`])
  }
  
  useEffect(() => {
    const checkAuth = async () => {
      addDebug('Starting auth check...')
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      addDebug(`Auth result: ${user ? 'User found' : 'No user'}`)
      addDebug(`Error: ${error ? error.message : 'None'}`)
      
      console.log('User:', user)
      console.log('Error:', error)
      
      setUser(user)
      setLoading(false)
      
      if (!user) {
        addDebug('No user found, redirecting to login')
        router.push('/')
      }
    }
    
    checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        addDebug(`Auth state change: ${event}`)
        console.log('Auth event:', event, session)
        
        if (event === 'SIGNED_IN') {
          setUser(session?.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/')
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              {user ? '🎉 Welcome!' : '❌ Not logged in'}
            </h2>
            
            {user ? (
              <>
                <p className="text-gray-600 mb-4">
                  Email: <strong>{user.email}</strong>
                </p>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <p className="text-gray-600">You should be redirected to login...</p>
            )}
          </div>
          
          <div className="bg-gray-100 rounded-xl shadow p-6">
            <h3 className="font-semibold mb-4">Debug Info</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {debug.map((msg, i) => (
                <div key={i} className="text-xs font-mono p-2 bg-gray-200 rounded">
                  {msg}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                supabase.auth.getUser().then(({ data }) => {
                  console.log('Manual check:', data)
                  addDebug(`Manual check: ${data.user ? 'User found' : 'No user'}`)
                })
              }}
              className="mt-4 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
            >
              Check Auth Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}