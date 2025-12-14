'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Tag, FileText, DollarSign } from 'lucide-react'

type Transaction = {
  id: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  date: string
}

type Category = {
  id: number
  name: string
  emoji: string
  color: string
  type: 'income' | 'expense' | 'both'
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Other')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const supabase = createClient()
  const router = useRouter()
  
  // Check auth and load data
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    
    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (categoriesData) setCategories(categoriesData)
    
    // Load transactions
    loadTransactions()
  }
  
  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Error loading transactions:', error)
      setMessage('Error loading transactions')
    } else if (data) {
      setTransactions(data)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid amount')
      setLoading(false)
      return
    }
    
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: parseFloat(amount),
        description,
        category,
        type,
        date
      })
    
    if (error) {
      console.error('Error saving transaction:', error)
      setMessage('Error saving transaction')
    } else {
      setMessage('✅ Transaction added successfully!')
      
      // Reset form
      setAmount('')
      setDescription('')
      setCategory('Other')
      setType('expense')
      setDate(new Date().toISOString().split('T')[0])
      
      // Reload transactions
      loadTransactions()
    }
    
    setLoading(false)
  }
  
  const deleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting transaction:', error)
      setMessage('Error deleting transaction')
    } else {
      setMessage('🗑️ Transaction deleted')
      loadTransactions()
    }
  }
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpenses
  
  // Get filtered categories based on type
  const filteredCategories = categories.filter(cat => 
    cat.type === 'both' || cat.type === type
  )
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">💳 Transactions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Add Transaction & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Transaction Form */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Add New Transaction</h2>
              
              {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : message.includes('🗑️') ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                  {message}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Toggle */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center">
                      <span className="text-sm">-</span>
                    </div>
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 ${type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center">
                      <span className="text-sm">+</span>
                    </div>
                    Income
                  </button>
                </div>
                
                {/* Amount */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <DollarSign className="w-4 h-4" />
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What was this for?"
                    required
                  />
                </div>
                
                {/* Category & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Tag className="w-4 h-4" />
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Add Transaction'}
                </button>
              </form>
            </div>
            
            {/* Transaction List */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Transactions</h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-gray-500">No transactions yet</p>
                  <p className="text-sm text-gray-400 mt-2">Add your first transaction above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <span className="text-lg">
                            {categories.find(c => c.name === transaction.category)?.emoji || '📊'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-gray-500">
                            {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </div>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Monthly Summary</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500">Total Income</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${totalIncome.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${totalIncome > 0 ? '100%' : '0%'}` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-600">
                      ${totalExpenses.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${totalExpenses > 0 ? '100%' : '0%'}` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-6 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Net Balance</div>
                    <div className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ${balance.toFixed(2)}
                    </div>
                  </div>
                  <div className={`h-2 ${balance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-full overflow-hidden mt-2`}>
                    <div 
                      className={`h-full ${balance >= 0 ? 'bg-blue-500' : 'bg-red-500'} rounded-full`}
                      style={{ width: `${Math.min(Math.abs(balance) / (totalIncome || 1) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Category Breakdown */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold mb-4">Category Breakdown</h3>
              
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-sm">Add transactions to see breakdown</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(
                    transactions.reduce((acc, t) => {
                      acc[t.category] = (acc[t.category] || 0) + t.amount
                      return acc
                    }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([cat, total]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {categories.find(c => c.name === cat)?.emoji || '📊'}
                          </span>
                          <span className="text-sm">{cat}</span>
                        </div>
                        <span className="font-medium">${total.toFixed(2)}</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{transactions.length}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {transactions.filter(t => t.type === 'income').length}
                  </div>
                  <div className="text-xs text-gray-500">Income</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {transactions.filter(t => t.type === 'expense').length}
                  </div>
                  <div className="text-xs text-gray-500">Expenses</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {new Set(transactions.map(t => t.category)).size}
                  </div>
                  <div className="text-xs text-gray-500">Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}