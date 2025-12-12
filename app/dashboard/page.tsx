// app/dashboard/page.tsx - UPDATED
'use client'


// app/dashboard/page.tsx - SIMPLE STATIC
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Finance Dashboard</h1>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 mb-4">
            🔨 Dashboard under construction
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Fixing authentication... Check back soon!
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            ← Back to login
          </a>
        </div>
      </div>
    </div>
  )
}