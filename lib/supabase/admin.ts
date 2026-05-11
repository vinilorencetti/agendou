import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Usa a service role key — bypassa RLS.
// NUNCA expor no cliente. Usar somente em Server Actions / Route Handlers.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
