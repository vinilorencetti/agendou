import { createClient } from '@/lib/supabase/server'

export async function getServices(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('display_order')
    .order('created_at')
  return data ?? []
}
