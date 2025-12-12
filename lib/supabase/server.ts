import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll()
        },
        async setAll(cookiesToSet) {
          try {
            const cStore = await cookieStore
            cookiesToSet.forEach(({ name, value, options }) =>
              cStore.set(name, value, options)
            )
          } catch (error) {
            console.error('Cookie error:', error)
          }
        },
      },
    }
  )
}