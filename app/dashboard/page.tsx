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
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      
      if (!user) {
        router.push('/')
      }
    }
    
    checkUser()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/')
        }
        setUser(session?.user || null)
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
          <p>Loading dashboard...</p>
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
      <div className="max-w-6xl mx-auto">
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
          <h2 className="text-2xl font-bold mb-4">🎉 Success! You're logged in!</h2>
          <p className="text-gray-600 mb-6">
            Now you can start building your finance tracker features.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="font-semibold text-lg mb-2">Add Transaction Form</h3>
              <p className="text-gray-600 text-sm">
                Build a form to add income/expenses
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-lg mb-2">Create Charts</h3>
              <p className="text-gray-600 text-sm">
                Show spending by category
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-lg mb-2">Track Budgets</h3>
              <p className="text-gray-600 text-sm">
                Set monthly spending limits
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Next Steps:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Create a transaction table in Supabase</li>
              <li>Build a form to add transactions</li>
              <li>Display transactions in a list</li>
              <li>Add charts with Recharts</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}