// app/auth/callback/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  console.log('🔗 Callback hit! URL:', requestUrl.toString())
  
  // Check for error
  const error = requestUrl.searchParams.get('error')
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/?error=${error}`)
  }
  
  // Check for access_token (Supabase redirects with this)
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')
  
  if (accessToken && refreshToken) {
    console.log('✅ Got tokens from Supabase redirect')
    // Store tokens (in real app, you'd set cookies)
    // For now, just redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }
  
  // If no tokens, maybe we got a code
  const code = requestUrl.searchParams.get('code')
  if (code) {
    console.log('📦 Got code, need to exchange')
    // You'd exchange code for tokens here
    // For simplicity, redirect to dashboard and let client handle it
    return NextResponse.redirect(`${requestUrl.origin}/dashboard?code=${code}`)
  }
  
  console.log('⚠️ No tokens or code found')
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}