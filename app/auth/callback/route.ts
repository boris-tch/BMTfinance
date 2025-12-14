import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Get the URL
  const requestUrl = new URL(request.url)
  
  // Get the code from Supabase redirect
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    console.log('✅ Got auth code from Supabase')
    
    // Redirect to a page that will exchange the code
    // The client will handle the exchange
    return NextResponse.redirect(`${requestUrl.origin}/auth/exchange?code=${code}`)
  }
  
  // If no code, something went wrong
  return NextResponse.redirect(`${requestUrl.origin}/?error=no_code`)
}