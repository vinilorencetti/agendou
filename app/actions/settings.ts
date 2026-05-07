'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { DayOfWeek } from '@/types/database'

export type BusinessHoursInput = {
  day: DayOfWeek
  isOpen: boolean
  openTime: string
  closeTime: string
}

export async function saveBusinessHours(tenantId: string, slug: string, hours: BusinessHoursInput[]) {
  const supabase = await createClient()

  const { error } = await supabase.from('tenant_business_hours').upsert(
    hours.map((h) => ({
      tenant_id: tenantId,
      day: h.day,
      is_open: h.isOpen,
      open_time: h.openTime,
      close_time: h.closeTime,
    })),
    { onConflict: 'tenant_id,day' }
  )

  if (error) return { success: false, error: 'Erro ao salvar horários.' }

  revalidatePath(`/admin/${slug}/configuracoes/horarios`)
  return { success: true }
}

export async function updateTenantAppearance(
  tenantId: string,
  slug: string,
  data: {
    logoUrl?: string
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tenants')
    .update({
      ...(data.logoUrl !== undefined && { logo_url: data.logoUrl || null }),
      ...(data.primaryColor !== undefined && { primary_color: data.primaryColor }),
      ...(data.secondaryColor !== undefined && { secondary_color: data.secondaryColor }),
      ...(data.backgroundColor !== undefined && { background_color: data.backgroundColor }),
    })
    .eq('id', tenantId)

  if (error) return { success: false, error: 'Erro ao salvar aparência.' }

  revalidatePath(`/admin/${slug}/configuracoes/aparencia`)
  revalidatePath(`/${slug}`)
  return { success: true }
}

export async function updateTenantProfile(
  tenantId: string,
  slug: string,
  data: {
    name?: string
    description?: string
    phone?: string
    cancellationPolicyHours?: number
    whatsapp?: string
    instagram?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tenants')
    .update({
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() || null }),
      ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
      ...(data.cancellationPolicyHours !== undefined && {
        cancellation_policy_hours: data.cancellationPolicyHours,
      }),
      ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp.trim() || null }),
      ...(data.instagram !== undefined && { instagram: data.instagram.trim() || null }),
    })
    .eq('id', tenantId)

  if (error) return { success: false, error: 'Erro ao salvar configurações.' }

  revalidatePath(`/admin/${slug}/configuracoes`)
  revalidatePath(`/${slug}`)
  return { success: true }
}
