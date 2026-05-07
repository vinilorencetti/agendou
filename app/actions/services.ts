'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ServiceInput = {
  tenantId: string
  name: string
  description?: string
  durationMin: number
  price: number
}

export async function createService(input: ServiceInput) {
  const supabase = await createClient()

  const { error } = await supabase.from('services').insert({
    tenant_id: input.tenantId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    duration_min: input.durationMin,
    price: input.price,
    is_active: true,
  })

  if (error) return { success: false, error: 'Erro ao criar serviço.' }

  revalidatePath(`/admin/${(await getTenantSlug(input.tenantId))}/configuracoes/servicos`)
  return { success: true }
}

export async function updateService(id: string, input: Partial<ServiceInput> & { tenantId: string }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .update({
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(input.durationMin !== undefined && { duration_min: input.durationMin }),
      ...(input.price !== undefined && { price: input.price }),
    })
    .eq('id', id)
    .eq('tenant_id', input.tenantId)

  if (error) return { success: false, error: 'Erro ao atualizar serviço.' }

  revalidatePath(`/admin/${(await getTenantSlug(input.tenantId))}/configuracoes/servicos`)
  return { success: true }
}

export async function deleteService(id: string, tenantId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { success: false, error: 'Erro ao excluir serviço.' }

  revalidatePath(`/admin/${(await getTenantSlug(tenantId))}/configuracoes/servicos`)
  return { success: true }
}

export async function toggleServiceActive(id: string, tenantId: string, isActive: boolean) {
  const supabase = await createClient()
  await supabase.from('services').update({ is_active: isActive }).eq('id', id).eq('tenant_id', tenantId)
  revalidatePath(`/admin/${(await getTenantSlug(tenantId))}/configuracoes/servicos`)
}

async function getTenantSlug(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('slug').eq('id', tenantId).single()
  return data?.slug ?? ''
}
