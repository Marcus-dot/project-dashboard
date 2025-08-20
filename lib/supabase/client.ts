// This file creates a Supabase client for use in the browser
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Create and return a Supabase client using our environment variables
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}