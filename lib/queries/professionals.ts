import { createClient } from '@/lib/supabase/server'

export async function getProfessionals(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('professionals')
    .select('*, professional_services(service_id), professional_schedules(*)')
    .eq('tenant_id', tenantId)
    .order('display_order')
    .order('created_at')
  return data ?? []
}

export async function getProfessionalSchedules(professionalId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('professional_schedules')
    .select('*')
    .eq('professional_id', professionalId)
    .order('day')
  return data ?? []
}
