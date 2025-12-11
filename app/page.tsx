import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const supabase = createClient()
  
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Finance Tracker</h1>
        <p className="mb-8">Track your money. 100% free.</p>
        <button 
          onClick={handleLogin}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          Login with GitHub
        </button>
      </div>
    </div>
  )
}