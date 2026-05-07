'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TenantStatus } from '@/types/database'

async function assertMasterAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'master_admin')
    .eq('is_active', true)
    .single()

  return data ? supabase : null
}

export async function setTenantStatus(tenantId: string, status: TenantStatus) {
  const supabase = await assertMasterAdmin()
  if (!supabase) return { success: false, error: 'Acesso negado.' }

  const { error } = await supabase
    .from('tenants')
    .update({ status })
    .eq('id', tenantId)

  if (error) return { success: false, error: 'Erro ao atualizar status.' }

  revalidatePath('/master-admin/tenants')
  revalidatePath(`/master-admin/tenants/${tenantId}`)
  return { success: true }
}
