'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      console.log('Dashboard auth check:', { user: user?.email, error })
      
      setUser(user)
      setLoading(false)
      
      if (!user) {
        console.log('No user, redirecting to login')
        router.push('/')
      }
    }
    
    checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event)
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
  
  if (!user) {
    return null // Will redirect via useEffect
  }
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            ✅ SUCCESS! You're logged in with Google!
          </h2>
          <p className="text-gray-600 mb-6">
            User ID: {user.id}
            <br />
            Email: {user.email}
          </p>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Next: Create transactions table</h3>
            <p className="text-sm text-blue-800">
              Now you can create a transactions table in Supabase that links to user_id
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}