import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('Callback hit with code:', code ? 'Yes' : 'No')
  
  if (code) {
    try {
      const cookieStore = await cookies()
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Exchange error:', error)
        return NextResponse.redirect(
          `${requestUrl.origin}/?error=${encodeURIComponent(error.message)}`
        )
      }
      
      console.log('✅ Server-side exchange successful')
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      
    } catch (error: any) {
      console.error('Server error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/?error=${encodeURIComponent(error.message)}`
      )
    }
  }
  
  return NextResponse.redirect(`${requestUrl.origin}/?error=no_code`)
}