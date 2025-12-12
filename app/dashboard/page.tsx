'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (!user) router.push('/')
    })
  }, [])
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">💰 Finance Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Welcome back! 🎉</h2>
            <p className="text-gray-600">
              You're now ready to build your finance tracker.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold text-lg mb-2">Add Transactions</h3>
              <p className="text-gray-600 mb-4">Start tracking income & expenses</p>
              <Link href="/transactions/add" className="text-blue-600 hover:underline">
                Start adding →
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-lg mb-2">View Dashboard</h3>
              <p className="text-gray-600 mb-4">See your spending patterns</p>
              <Link href="/analytics" className="text-blue-600 hover:underline">
                View analytics →
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-lg mb-2">Set Budgets</h3>
              <p className="text-gray-600 mb-4">Plan your monthly spending</p>
              <Link href="/budgets" className="text-blue-600 hover:underline">
                Set budgets →
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold text-lg mb-4">What to build next:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Transaction form (amount, category, date)</li>
              <li>Transaction list display</li>
              <li>Monthly summary calculations</li>
              <li>Category pie chart</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}