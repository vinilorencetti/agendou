'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ManualEntryInput = {
  tenantId: string
  type: 'income' | 'expense'
  description: string
  amount: number
  dueDate: string
  category?: string
  notes?: string
  professionalId?: string
}

export async function createManualEntry(input: ManualEntryInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado.' }

  const { error } = await supabase.from('financial_entries').insert({
    tenant_id: input.tenantId,
    type: input.type,
    status: 'pending',
    description: input.description.trim(),
    amount: input.amount,
    due_date: input.dueDate,
    category: input.category?.trim() || null,
    notes: input.notes?.trim() || null,
    professional_id: input.professionalId || null,
    created_by: user.id,
  })

  if (error) return { success: false, error: 'Erro ao criar lançamento.' }

  const slug = await getTenantSlug(input.tenantId)
  revalidatePath(`/admin/${slug}/financeiro`)
  return { success: true }
}

export async function markEntryAsPaid(entryId: string, tenantId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('financial_entries')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('tenant_id', tenantId)

  if (error) return { success: false, error: 'Erro ao atualizar lançamento.' }

  const slug = await getTenantSlug(tenantId)
  revalidatePath(`/admin/${slug}/financeiro`)
  return { success: true }
}

export async function cancelEntry(entryId: string, tenantId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('financial_entries')
    .update({ status: 'cancelled' })
    .eq('id', entryId)
    .eq('tenant_id', tenantId)
    .neq('status', 'paid')

  if (error) return { success: false, error: 'Erro ao cancelar lançamento.' }

  const slug = await getTenantSlug(tenantId)
  revalidatePath(`/admin/${slug}/financeiro`)
  return { success: true }
}

async function getTenantSlug(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('slug').eq('id', tenantId).single()
  return data?.slug ?? ''
}
