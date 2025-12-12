// app/auth/callback/route.ts - ADD LOGGING
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🎯 CALLBACK ROUTE HIT!')
  console.log('Full URL:', request.url)
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  
  console.log('Code exists:', !!code)
  console.log('Error:', error)
  
  // Just redirect for now
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}