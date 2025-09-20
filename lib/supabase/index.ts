// /lib/supabase/index.ts
// Re-export clients for convenience
// Note: Only use these exports when you're certain about the environment
// For explicit control, import directly from './client' or './server'

export { createClient } from './client'
export { createServer, createAdmin } from './server'