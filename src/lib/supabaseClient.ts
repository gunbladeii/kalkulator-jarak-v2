import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and Key with fallback and validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// Validation for missing environment variables
if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL in your environment variables.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.')
}

console.log('🔧 Supabase Client initialized with URL:', supabaseUrl.substring(0, 30) + '...')

// Apply SSL bypass for development environment
if (process.env.NODE_ENV === 'development') {
  // Disable SSL verification for Node.js in development
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  console.log('⚠️ SSL verification disabled for development');
}

// Create and export Supabase client with basic config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})