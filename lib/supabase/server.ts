// This file creates a Supabase client for use on the server
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    // Get the cookie store (for authentication)
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Get a cookie value
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                // Set a cookie value (for login)
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // This is okay - happens in Server Components
                    }
                },
                // Remove a cookie (for logout)
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // This is okay - happens in Server Components
                    }
                },
            },
        }
    )
}