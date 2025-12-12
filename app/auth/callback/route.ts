import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  const supabase = createClient()
  
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  // Redirect to dashboard
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}