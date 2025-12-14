'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CreditCard, 
  TrendingUp,
  TrendingDown,
  LogOut,
  ChevronRight,
  Wallet,
  PieChart,
  Plus  // Added this import
} from 'lucide-react'

type Transaction = {
  id: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  date: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactionCount: 0
  })
  
  const supabase = createClient()
  const router = useRouter()
  
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }
      
      setUser(user)
      
      // Load real transactions
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10)
      
      if (transactionsData) {
        setTransactions(transactionsData)
        
        // Calculate real stats
        const totalIncome = transactionsData
          .filter((t: Transaction) => t.type === 'income')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
          
        const totalExpenses = transactionsData
          .filter((t: Transaction) => t.type === 'expense')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
          
        setStats({
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          transactionCount: transactionsData.length
        })
      }
      
      setLoading(false)
    }
    
    loadData()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
          <p className="text-gray-400 text-sm">Loading your finances...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
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
                <p className="text-xs text-gray-500">Personal Financial Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back</p>
                <p className="text-sm">{user.email?.split('@')[0]}</p>
              </div>
              <div className="h-8 w-px bg-[#222222]"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg hover:bg-[#222222] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Financial Overview</h2>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Financial Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Balance</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${stats.balance >= 0 ? 'bg-[#00ff8f]' : 'bg-[#ff6666]'}`}></div>
            </div>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
              {formatCurrency(stats.balance)}
            </div>
          </div>
          
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Income</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#00ff8f]">
              {formatCurrency(stats.totalIncome)}
            </div>
          </div>
          
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Expenses</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#ff6666]">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </div>
          
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Transactions</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-300">
              {stats.transactionCount}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transactions */}
          <div className="lg:col-span-2">
            <Link href="/transactions">
              <div className="bg-[#111111] border border-[#222222] rounded-lg p-5 hover:border-[#333333] hover:bg-[#131313] transition-all cursor-pointer mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a1a1a] border border-[#222222] rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#66b3ff]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Transaction Manager</h3>
                      <p className="text-sm text-gray-500">Add, edit, and track your finances</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
                
                {transactions.length === 0 ? (
                  <div className="text-center py-8 border-t border-[#222222]">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-sm text-gray-400 mt-1">Click here to add your first transaction</p>
                  </div>
                ) : (
                  <div className="space-y-3 border-t border-[#222222] pt-4">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#222222] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${tx.type === 'income' ? 'bg-[#00ff8f]/10' : 'bg-[#ff6666]/10'}`}>
                            <span className={`text-sm ${tx.type === 'income' ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
                              {tx.type === 'income' ? '↑' : '↓'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm">{tx.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{tx.category}</span>
                              <span>•</span>
                              <span>{formatDate(tx.date)}</span>
                            </div>
                          </div>
                        </div>
                        <p className={`text-sm font-medium ${tx.type === 'income' ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    ))}
                    
                    {transactions.length >= 10 && (
                      <div className="pt-3 text-center">
                        <span className="text-sm text-gray-500">View all transactions →</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>

            {/* Quick Add Section */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-5">
              <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/transactions">
                  <div className="p-4 bg-[#1a1a1a] border border-[#333333] rounded-lg hover:border-[#444444] hover:bg-[#222222] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-[#00ff8f]/10 rounded flex items-center justify-center">
                        <Plus className="w-4 h-4 text-[#00ff8f]" />
                      </div>
                      <div>
                        <h4 className="font-medium">Add Transaction</h4>
                        <p className="text-xs text-gray-500">Record income or expense</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <div className="p-4 bg-[#1a1a1a] border border-[#333333] rounded-lg opacity-50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">View Reports</h4>
                      <p className="text-xs text-gray-500">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-6">
            {/* Monthly Overview */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-5">
              <h3 className="font-semibold text-lg mb-4">Monthly Overview</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Income this month</span>
                    <span className="text-[#00ff8f]">{formatCurrency(stats.totalIncome)}</span>
                  </div>
                  <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00ff8f] rounded-full"
                      style={{ width: `${stats.totalIncome > 0 ? '100%' : '0%'}` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Expenses this month</span>
                    <span className="text-[#ff6666]">{formatCurrency(stats.totalExpenses)}</span>
                  </div>
                  <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#ff6666] rounded-full"
                      style={{ width: `${stats.totalExpenses > 0 ? '100%' : '0%'}` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[#222222]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Net flow</span>
                    <span className={`text-lg font-bold ${stats.balance >= 0 ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
                      {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spending by Category */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-5">
              <h3 className="font-semibold text-lg mb-4">Spending by Category</h3>
              
              {transactions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add transactions to see breakdown</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(
                    transactions.reduce((acc: Record<string, number>, t) => {
                      if (t.type === 'expense') {
                        acc[t.category] = (acc[t.category] || 0) + t.amount
                      }
                      return acc
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                    .map(([cat, total]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center">
                            <span className="text-xs">💰</span>
                          </div>
                          <span className="text-sm">{cat}</span>
                        </div>
                        <span className="text-sm font-medium text-[#ff6666]">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    ))
                  }
                  
                  {Object.keys(
                    transactions.reduce((acc: Record<string, number>, t) => {
                      if (t.type === 'expense') {
                        acc[t.category] = (acc[t.category] || 0) + t.amount
                      }
                      return acc
                    }, {})
                  ).length > 4 && (
                    <div className="pt-2 text-center">
                      <span className="text-xs text-gray-500">And more...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-5">
              <h3 className="font-semibold text-lg mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Data synced</span>
                  <span className="text-[#00ff8f] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#00ff8f] rounded-full"></div>
                    Active
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last updated</span>
                  <span>Just now</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Account since</span>
                  <span>{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
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
            <div>
              <p className="mb-1">BMT Finance • Personal Financial Manager</p>
              <p className="text-gray-600">User ID: {user.id.slice(0, 8)}... • {user.email}</p>
            </div>
            <div className="text-right">
              <p>Secure connection • Data encrypted</p>
              <p className="text-gray-600">Last refresh: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}