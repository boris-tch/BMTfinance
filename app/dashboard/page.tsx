'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Activity, 
  TrendingUp, 
  CreditCard, 
  PieChart,
  LogOut,
  ChevronRight
} from 'lucide-react'

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00ff8f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm font-mono tracking-wider">LOADING TERMINAL...</p>
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
  
  // Mock data for demo
  const metrics = [
    { label: 'NET WORTH', value: '$45,289.42', change: '+2.4%', icon: <Activity className="w-4 h-4" />, color: 'text-[#00ff8f]' },
    { label: 'MONTHLY SPEND', value: '$3,842.16', change: '-1.2%', icon: <CreditCard className="w-4 h-4" />, color: 'text-[#66b3ff]' },
    { label: 'INVESTMENTS', value: '$18,500.00', change: '+5.7%', icon: <TrendingUp className="w-4 h-4" />, color: 'text-[#ffcc00]' },
    { label: 'SAVINGS RATE', value: '24.3%', change: '+0.8%', icon: <PieChart className="w-4 h-4" />, color: 'text-[#cc66ff]' },
  ]

  const recentTransactions = [
    { id: 1, name: 'AWS Services', amount: '$89.50', type: 'expense', category: 'Tech', time: '2h ago' },
    { id: 2, name: 'Freelance Payment', amount: '$1,200.00', type: 'income', category: 'Work', time: '5h ago' },
    { id: 3, name: 'Grocery Store', amount: '$68.30', type: 'expense', category: 'Food', time: '1d ago' },
    { id: 4, name: 'Stock Dividend', amount: '$42.15', type: 'income', category: 'Investing', time: '2d ago' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Top Navigation */}
      <div className="border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00ff8f] rounded-md"></div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">BMT FINANCE</h1>
                <p className="text-xs text-gray-500 font-mono">TERMINAL SESSION ACTIVE</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-400">USER</p>
                <p className="text-sm font-mono">{user.email?.split('@')[0]}</p>
              </div>
              <div className="h-8 w-px bg-[#222222]"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg hover:bg-[#222222] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">LOGOUT</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">TERMINAL DASHBOARD</h2>
          <p className="text-gray-500 text-sm font-mono">SYSTEM TIME: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-[#111111] border border-[#222222] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-gray-500">{metric.icon}</div>
                  <span className="text-xs text-gray-500 tracking-wider">{metric.label}</span>
                </div>
                <span className={`text-xs font-mono ${metric.change.startsWith('+') ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
                  {metric.change}
                </span>
              </div>
              <div className={`text-2xl font-bold font-mono ${metric.color}`}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Modules */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transactions Module */}
            <Link href="/transactions">
              <div className="bg-[#111111] border border-[#222222] rounded-lg p-5 hover:border-[#333333] hover:bg-[#131313] transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a1a1a] border border-[#222222] rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#66b3ff]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">TRANSACTIONS</h3>
                      <p className="text-sm text-gray-500">Record & analyze financial activity</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#222222] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${tx.type === 'income' ? 'bg-[#00ff8f]/10' : 'bg-[#ff6666]/10'}`}>
                          <span className={`text-xs ${tx.type === 'income' ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
                            {tx.type === 'income' ? '↑' : '↓'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm">{tx.name}</p>
                          <p className="text-xs text-gray-500">{tx.category} • {tx.time}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-mono ${tx.type === 'income' ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Coming Soon Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'PORTFOLIO', desc: 'Investment tracking', icon: <TrendingUp className="w-5 h-5" />, color: 'text-[#ffcc00]' },
                { title: 'ANALYTICS', desc: 'Advanced reporting', icon: <PieChart className="w-5 h-5" />, color: 'text-[#cc66ff]' },
                { title: 'BUDGETS', desc: 'Spending limits', icon: <Activity className="w-5 h-5" />, color: 'text-[#00ff8f]' },
                { title: 'BILLS', desc: 'Recurring payments', icon: <CreditCard className="w-5 h-5" />, color: 'text-[#66b3ff]' },
              ].map((module, index) => (
                <div key={index} className="bg-[#111111] border border-[#222222] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${module.color}`}>
                      {module.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{module.title}</h4>
                      <p className="text-xs text-gray-500">{module.desc}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono bg-[#1a1a1a] px-3 py-1.5 rounded border border-[#222222]">
                    COMING SOON
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - System Status */}
          <div className="space-y-6">
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-5">
              <h3 className="font-semibold text-lg mb-4">SESSION STATUS</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">USER ID</span>
                    <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
                  </div>
                  <div className="h-1 bg-[#222222] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00ff8f] rounded-full w-3/4"></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">DATA SYNC</span>
                    <span className="font-mono text-xs text-[#00ff8f]">ACTIVE</span>
                  </div>
                  <div className="h-1 bg-[#222222] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00ff8f] rounded-full w-full"></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">SECURITY</span>
                    <span className="font-mono text-xs text-[#00ff8f]">VERIFIED</span>
                  </div>
                  <div className="h-1 bg-[#222222] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00ff8f] rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-lg p-5">
              <h3 className="font-semibold text-lg mb-4">SYSTEM INFO</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VERSION</span>
                  <span className="font-mono">BMT_TERMINAL v2.1</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">API STATUS</span>
                  <span className="font-mono text-[#00ff8f]">ONLINE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">LAST SYNC</span>
                  <span className="font-mono">Just now</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ENCRYPTION</span>
                  <span className="font-mono">AES-256</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="border-t border-[#222222] mt-8 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <p className="font-mono">BMT FINANCE TERMINAL © 2024</p>
            <div className="flex items-center gap-4">
              <span className="font-mono">LATENCY: 23ms</span>
              <div className="w-2 h-2 bg-[#00ff8f] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}