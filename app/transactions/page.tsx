'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Tag, 
  FileText, 
  DollarSign,
  Filter,
  Download,
  ChevronLeft,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  Upload,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react'

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

type CSVRow = {
  Date: string
  Type: string
  'Merchant/Description': string
  'Debit/Credit': string
  Balance: string
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [csvImport, setCsvImport] = useState({
    isOpen: false,
    isProcessing: false,
    file: null as File | null,
    preview: [] as CSVRow[],
    stats: {
      total: 0,
      success: 0,
      failed: 0,
      duplicates: 0
    }
  })
  
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
      .limit(100)
    
    if (error) {
      console.error('Error loading transactions:', error)
      setMessage('ERROR: Failed to load transactions')
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
      setMessage('ERROR: Please enter a valid amount')
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
      setMessage('ERROR: Failed to save transaction')
    } else {
      setMessage('SUCCESS: Transaction recorded')
      
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
      setMessage('ERROR: Failed to delete transaction')
    } else {
      setMessage('DELETED: Transaction removed')
      loadTransactions()
    }
  }

  // CSV Import Functions
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n')
    const headers = lines[0].split(';').map(h => h.trim())
    
    // Remove empty lines and footer lines
    const dataLines = lines.slice(1).filter(line => 
      line.trim() && 
      !line.includes('Arranged overdraft limit') &&
      line.split(';').length >= headers.length
    )
    
    return dataLines.map(line => {
      const values = line.split(';').map(v => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        if (values[index]) {
          row[header] = values[index]
        }
      })
      return row
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const rows = parseCSV(text)
    
    // Preview first 5 rows
    setCsvImport(prev => ({
      ...prev,
      file,
      preview: rows.slice(0, 5),
      stats: { ...prev.stats, total: rows.length }
    }))
  }

  const processCSVImport = async () => {
    if (!csvImport.file) return
    
    setCsvImport(prev => ({ ...prev, isProcessing: true }))
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }
    
    const text = await csvImport.file.text()
    const rows = parseCSV(text)
    const stats = { total: rows.length, success: 0, failed: 0, duplicates: 0 }
    
    for (const row of rows) {
      try {
        // Parse amount - remove currency symbol and convert to positive number
        let amountStr = row['Debit/Credit'] || ''
        const isExpense = amountStr.includes('-')
        const amount = Math.abs(parseFloat(amountStr.replace(/[^0-9.-]/g, '')))
        
        if (isNaN(amount) || amount <= 0) {
          stats.failed++
          continue
        }
        
        // Parse date (DD/MM/YYYY to YYYY-MM-DD)
        const [day, month, year] = row.Date.split('/')
        const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        
        // Determine transaction type based on amount sign
        const type = isExpense ? 'expense' : 'income'
        
        // Determine category based on description
        const description = row['Merchant/Description'] || row.Type || 'Unknown'
        let category = 'Other'
        
        // Map bank transaction types to categories
        if (row.Type?.includes('PAYMENT')) {
          category = isExpense ? 'Shopping' : 'Other Income'
        } else if (row.Type?.includes('INTEREST')) {
          category = 'Investments'
        } else if (row.Type?.includes('TRANSFER')) {
          category = 'Transfer'
        } else if (row.Type?.includes('PAYMENTS')) {
          category = 'Bills'
        } else if (description.toLowerCase().includes('grocery') || 
                   description.toLowerCase().includes('food')) {
          category = 'Food'
        } else if (description.toLowerCase().includes('uber') || 
                   description.toLowerCase().includes('transport')) {
          category = 'Transport'
        }
        
        // Check for duplicates (same date, amount, and description)
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', date)
          .eq('amount', amount)
          .eq('description', description)
          .single()
        
        if (existing) {
          stats.duplicates++
          continue
        }
        
        // Insert transaction
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            amount,
            description,
            category,
            type,
            date
          })
        
        if (error) {
          console.error('Error importing transaction:', error)
          stats.failed++
        } else {
          stats.success++
        }
        
      } catch (error) {
        console.error('Error processing row:', error)
        stats.failed++
      }
    }
    
    // Update stats and close modal
    setCsvImport(prev => ({ 
      ...prev, 
      isProcessing: false, 
      stats,
      isOpen: false 
    }))
    
    // Reload transactions
    await loadTransactions()
    
    // Show import summary
    setMessage(`IMPORT COMPLETE: ${stats.success} imported, ${stats.failed} failed, ${stats.duplicates} duplicates skipped`)
  }

  // Calculate totals
  const filteredTransactions = transactions.filter(t => 
    activeFilter === 'all' || t.type === activeFilter
  )
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpenses
  
  // Get filtered categories based on type
  const filteredCategories = categories.filter(cat => 
    cat.type === 'both' || cat.type === type
  )
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* CSV Import Modal */}
      {csvImport.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#222222] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Import CSV Transactions</h3>
                <button
                  onClick={() => setCsvImport(prev => ({ ...prev, isOpen: false }))}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              {!csvImport.file ? (
                <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="px-6 py-3 bg-[#00ff8f]/10 text-[#00ff8f] rounded-lg hover:bg-[#00ff8f]/20 transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Select CSV File
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Upload your bank statement CSV file (Midata format)
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#1a1a1a] p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">{csvImport.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {csvImport.stats.total} transactions found
                        </p>
                      </div>
                      <button
                        onClick={() => setCsvImport(prev => ({ ...prev, file: null, preview: [] }))}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        Change file
                      </button>
                    </div>
                    
                    {/* Preview Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[#222222]">
                          <tr>
                            <th className="text-left p-2 text-gray-500">Date</th>
                            <th className="text-left p-2 text-gray-500">Type</th>
                            <th className="text-left p-2 text-gray-500">Description</th>
                            <th className="text-left p-2 text-gray-500">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvImport.preview.map((row, index) => (
                            <tr key={index} className="border-b border-[#222222] last:border-0">
                              <td className="p-2">{row.Date}</td>
                              <td className="p-2">{row.Type}</td>
                              <td className="p-2 truncate max-w-[200px]" title={row['Merchant/Description']}>
                                {row['Merchant/Description']}
                              </td>
                              <td className={`p-2 ${row['Debit/Credit']?.includes('-') ? 'text-[#ff6666]' : 'text-[#00ff8f]'}`}>
                                {row['Debit/Credit']}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {csvImport.preview.length < csvImport.stats.total && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Showing first 5 of {csvImport.stats.total} transactions
                      </p>
                    )}
                  </div>
                  
                  {/* Import Options */}
                  <div className="space-y-4">
                    <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#222222]">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <h4 className="font-medium">Import Options</h4>
                      </div>
                      <ul className="text-sm text-gray-400 space-y-1 ml-8">
                        <li>• Duplicate transactions will be skipped</li>
                        <li>• Dates will be converted to YYYY-MM-DD format</li>
                        <li>• Categories will be auto-detected based on descriptions</li>
                        <li>• Import may take a few moments</li>
                      </ul>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={processCSVImport}
                        disabled={csvImport.isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#00ff8f]/10 border border-[#00ff8f]/30 text-[#00ff8f] p-3 rounded-lg font-medium hover:bg-[#00ff8f]/20 transition-colors disabled:opacity-50"
                      >
                        {csvImport.isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Import {csvImport.stats.total} Transactions
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setCsvImport(prev => ({ ...prev, isOpen: false }))}
                        className="px-6 py-3 border border-[#333333] rounded-lg hover:bg-[#222222] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">DASHBOARD</span>
              </button>
              <div className="w-px h-6 bg-[#222222]"></div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#00ff8f] rounded-md"></div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">TRANSACTIONS</h1>
                  <p className="text-xs text-gray-500 font-mono">FINANCIAL ACTIVITY LOG</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCsvImport(prev => ({ ...prev, isOpen: true }))}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg hover:bg-[#222222] transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                IMPORT CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg hover:bg-[#222222] transition-colors text-sm">
                <Download className="w-4 h-4" />
                EXPORT
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">BALANCE</span>
              <div className={`w-2 h-2 rounded-full ${balance >= 0 ? 'bg-[#00ff8f]' : 'bg-[#ff6666]'}`}></div>
            </div>
            <div className={`text-2xl font-bold font-mono ${balance >= 0 ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
              {formatCurrency(balance)}
            </div>
          </div>
          
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">INCOME</span>
              <TrendingUp className="w-4 h-4 text-[#00ff8f]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#00ff8f]">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">EXPENSES</span>
              <TrendingDown className="w-4 h-4 text-[#ff6666]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#ff6666]">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">TRANSACTIONS</span>
              <span className="text-xs text-gray-500">{filteredTransactions.length}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-gray-300">
              {filteredTransactions.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            {/* Add Transaction Form */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">NEW TRANSACTION</h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">ENTRY FORM</span>
                </div>
              </div>
              
              {message && (
                <div className={`mb-6 p-3 rounded border text-sm font-mono ${
                  message.includes('SUCCESS') ? 'bg-[#00ff8f]/10 border-[#00ff8f]/30 text-[#00ff8f]' :
                  message.includes('ERROR') ? 'bg-[#ff6666]/10 border-[#ff6666]/30 text-[#ff6666]' :
                  message.includes('DELETED') ? 'bg-[#ffcc00]/10 border-[#ffcc00]/30 text-[#ffcc00]' :
                  message.includes('IMPORT') ? 'bg-[#66b3ff]/10 border-[#66b3ff]/30 text-[#66b3ff]' :
                  'bg-[#ffcc00]/10 border-[#ffcc00]/30 text-[#ffcc00]'
                }`}>
                  {message}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`p-4 rounded-lg border flex items-center justify-center gap-3 transition-all ${
                      type === 'expense' 
                        ? 'bg-[#ff6666]/10 border-[#ff6666]/30 text-[#ff6666]' 
                        : 'bg-[#1a1a1a] border-[#333333] text-gray-400 hover:border-[#444444]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      type === 'expense' ? 'bg-[#ff6666]/20' : 'bg-[#222222]'
                    }`}>
                      <span className="text-lg">-</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">EXPENSE</div>
                      <div className="text-xs text-gray-500">Money going out</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`p-4 rounded-lg border flex items-center justify-center gap-3 transition-all ${
                      type === 'income' 
                        ? 'bg-[#00ff8f]/10 border-[#00ff8f]/30 text-[#00ff8f]' 
                        : 'bg-[#1a1a1a] border-[#333333] text-gray-400 hover:border-[#444444]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      type === 'income' ? 'bg-[#00ff8f]/20' : 'bg-[#222222]'
                    }`}>
                      <span className="text-lg">+</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">INCOME</div>
                      <div className="text-xs text-gray-500">Money coming in</div>
                    </div>
                  </button>
                </div>
                
                {/* Amount & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <DollarSign className="w-4 h-4" />
                      AMOUNT
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 p-3 bg-[#1a1a1a] border border-[#333333] rounded-lg focus:border-[#00ff8f] focus:ring-1 focus:ring-[#00ff8f] focus:outline-none font-mono"
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <FileText className="w-4 h-4" />
                      DESCRIPTION
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 bg-[#1a1a1a] border border-[#333333] rounded-lg focus:border-[#00ff8f] focus:ring-1 focus:ring-[#00ff8f] focus:outline-none"
                      placeholder="Transaction purpose"
                      required
                    />
                  </div>
                </div>
                
                {/* Category & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Tag className="w-4 h-4" />
                      CATEGORY
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 bg-[#1a1a1a] border border-[#333333] rounded-lg focus:border-[#00ff8f] focus:ring-1 focus:ring-[#00ff8f] focus:outline-none"
                    >
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      DATE
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 bg-[#1a1a1a] border border-[#333333] rounded-lg focus:border-[#00ff8f] focus:ring-1 focus:ring-[#00ff8f] focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#00ff8f]/10 border border-[#00ff8f]/30 text-[#00ff8f] p-3 rounded-lg font-medium hover:bg-[#00ff8f]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      RECORD TRANSACTION
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-gray-500">FILTER:</span>
              <div className="flex gap-2">
                {(['all', 'income', 'expense'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === filter
                        ? filter === 'income' 
                          ? 'bg-[#00ff8f]/10 text-[#00ff8f] border border-[#00ff8f]/30'
                          : filter === 'expense'
                          ? 'bg-[#ff6666]/10 text-[#ff6666] border border-[#ff6666]/30'
                          : 'bg-[#66b3ff]/10 text-[#66b3ff] border border-[#66b3ff]/30'
                        : 'bg-[#1a1a1a] text-gray-400 border border-[#333333] hover:border-[#444444]'
                    }`}
                  >
                    {filter.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-500 ml-auto font-mono">
                {filteredTransactions.length} RECORDS
              </div>
            </div>
            
            {/* Transaction Table */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#222222] bg-[#0f0f0f]">
                      <th className="text-left p-4 text-sm text-gray-500 font-medium">DATE</th>
                      <th className="text-left p-4 text-sm text-gray-500 font-medium">DESCRIPTION</th>
                      <th className="text-left p-4 text-sm text-gray-500 font-medium">CATEGORY</th>
                      <th className="text-left p-4 text-sm text-gray-500 font-medium">TYPE</th>
                      <th className="text-left p-4 text-sm text-gray-500 font-medium">AMOUNT</th>
                      <th className="text-left p-4 text-sm text-gray-500 font-medium">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <div className="text-4xl mb-3">📊</div>
                            <p>No transactions found</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Add transactions manually or import a CSV file
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-[#222222] hover:bg-[#131313] transition-colors">
                          <td className="p-4">
                            <div className="text-sm font-mono">{formatDate(transaction.date)}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{transaction.description}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{categories.find(c => c.name === transaction.category)?.emoji || '📊'}</span>
                              <span className="text-sm">{transaction.category}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'income'
                                ? 'bg-[#00ff8f]/10 text-[#00ff8f]'
                                : 'bg-[#ff6666]/10 text-[#ff6666]'
                            }`}>
                              {transaction.type === 'income' ? 'INCOME' : 'EXPENSE'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`text-lg font-bold font-mono ${
                              transaction.type === 'income' ? 'text-[#00ff8f]' : 'text-[#ff6666]'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="p-2 text-gray-400 hover:text-[#ff6666] hover:bg-[#ff6666]/10 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Right Column - Analysis */}
          <div className="space-y-6">
            {/* Category Breakdown */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">CATEGORY BREAKDOWN</h3>
                <span className="text-xs text-gray-500 font-mono">TOP 5</span>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    transactions.reduce((acc, t) => {
                      acc[t.category] = (acc[t.category] || 0) + t.amount
                      return acc
                    }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([cat, total], index) => {
                      const percentage = (total / (totalIncome + totalExpenses)) * 100
                      return (
                        <div key={cat} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {categories.find(c => c.name === cat)?.emoji || '📊'}
                              </span>
                              <span className="text-sm">{cat}</span>
                            </div>
                            <span className="text-sm font-mono">{formatCurrency(total)}</span>
                          </div>
                          <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#00ff8f] rounded-full"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              )}
            </div>
            
            {/* Monthly Trends */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-6">
              <h3 className="font-bold mb-6">MONTHLY TRENDS</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">THIS MONTH</span>
                    <span className={`font-mono ${balance >= 0 ? 'text-[#00ff8f]' : 'text-[#ff6666]'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                  <div className="h-2 bg-[#222222] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${balance >= 0 ? 'bg-[#00ff8f]' : 'bg-[#ff6666]'}`}
                      style={{ width: `${Math.min(Math.abs(balance) / (totalIncome || 1) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[#222222]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-[#1a1a1a] rounded border border-[#222222]">
                      <div className="text-xs text-gray-500 mb-1">INCOME/DAY</div>
                      <div className="text-lg font-bold font-mono text-[#00ff8f]">
                        {formatCurrency(totalIncome / 30)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-[#1a1a1a] rounded border border-[#222222]">
                      <div className="text-xs text-gray-500 mb-1">EXPENSE/DAY</div>
                      <div className="text-lg font-bold font-mono text-[#ff6666]">
                        {formatCurrency(totalExpenses / 30)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Import Stats */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-6">
              <h3 className="font-bold mb-6">IMPORT STATS</h3>
              <div className="space-y-4">
                <div className="p-3 bg-[#1a1a1a] rounded border border-[#222222]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Total Transactions</span>
                    <span className="font-mono">{transactions.length}</span>
                  </div>
                  <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00ff8f] rounded-full"
                      style={{ width: `${Math.min(transactions.length / 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCsvImport(prev => ({ ...prev, isOpen: true }))}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#66b3ff]/10 border border-[#66b3ff]/30 text-[#66b3ff] p-2 rounded-lg hover:bg-[#66b3ff]/20 transition-colors text-sm"
                  >
                    <Upload className="w-3 h-3" />
                    IMPORT CSV
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#333333] p-2 rounded-lg hover:bg-[#222222] transition-colors text-sm">
                    <Download className="w-3 h-3" />
                    EXPORT DATA
                  </button>
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
            <p className="font-mono">TRANSACTIONS MODULE • DATA: {new Date().getFullYear()}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00ff8f] rounded-full"></div>
              <span className="font-mono">SYNC ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}