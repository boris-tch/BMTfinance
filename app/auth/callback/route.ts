import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/?error=${error.message}`)
    }
  }

  // Add a small delay to ensure cookies are set
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}