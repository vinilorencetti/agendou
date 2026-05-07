import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row']

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  return data
}

export async function getTenantServices(tenantId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('display_order')

  return data ?? []
}

export async function getTenantProfessionals(tenantId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('professionals')
    .select('*, professional_services(service_id), professional_schedules(*)')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('display_order')

  return data ?? []
}
