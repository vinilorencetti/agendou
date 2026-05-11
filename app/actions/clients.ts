'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ClientUpdateInput = {
  fullName: string
  phone?: string
  email?: string
  notes?: string
}

export async function updateClient(
  clientId: string,
  tenantId: string,
  input: ClientUpdateInput,
  slug: string,
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .eq('id', clientId)
    .eq('tenant_id', tenantId)

  if (error) return { success: false, error: 'Erro ao atualizar cadastro.' }

  revalidatePath(`/admin/${slug}/clientes`)
  revalidatePath(`/admin/${slug}/clientes/${clientId}`)
  return { success: true }
}
