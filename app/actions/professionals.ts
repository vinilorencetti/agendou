'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DayOfWeek } from '@/types/database'

type ProfessionalInput = {
  tenantId: string
  name: string
  bio?: string
  commissionPct?: number
  serviceIds: string[]
  avatarUrl?: string
}

export async function createProfessional(input: ProfessionalInput) {
  const supabase = await createClient()

  const { data: pro, error } = await supabase
    .from('professionals')
    .insert({
      tenant_id: input.tenantId,
      name: input.name.trim(),
      bio: input.bio?.trim() || null,
      commission_pct: input.commissionPct ?? 0,
      avatar_url: input.avatarUrl || null,
      is_active: true,
    })
    .select('id')
    .single()

  if (error || !pro) return { success: false, error: 'Erro ao criar profissional.' }

  if (input.serviceIds.length > 0) {
    await supabase.from('professional_services').insert(
      input.serviceIds.map((service_id) => ({ professional_id: pro.id, service_id }))
    )
  }

  // Cria horários de trabalho padrão (herda horário do tenant — seg-sex 09-18, sáb 09-14)
  const defaultSchedule: { professional_id: string; day: DayOfWeek; is_working: boolean; start_time: string; end_time: string }[] = [
    { professional_id: pro.id, day: 'monday',    is_working: true,  start_time: '09:00', end_time: '18:00' },
    { professional_id: pro.id, day: 'tuesday',   is_working: true,  start_time: '09:00', end_time: '18:00' },
    { professional_id: pro.id, day: 'wednesday', is_working: true,  start_time: '09:00', end_time: '18:00' },
    { professional_id: pro.id, day: 'thursday',  is_working: true,  start_time: '09:00', end_time: '18:00' },
    { professional_id: pro.id, day: 'friday',    is_working: true,  start_time: '09:00', end_time: '18:00' },
    { professional_id: pro.id, day: 'saturday',  is_working: true,  start_time: '09:00', end_time: '14:00' },
    { professional_id: pro.id, day: 'sunday',    is_working: false, start_time: '09:00', end_time: '12:00' },
  ]
  await supabase.from('professional_schedules').insert(defaultSchedule)

  const slug = await getTenantSlug(input.tenantId)
  revalidatePath(`/admin/${slug}/configuracoes/profissionais`)
  return { success: true }
}

export async function updateProfessional(
  id: string,
  input: Partial<ProfessionalInput> & { tenantId: string }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('professionals')
    .update({
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.bio !== undefined && { bio: input.bio?.trim() || null }),
      ...(input.commissionPct !== undefined && { commission_pct: input.commissionPct }),
      ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl || null }),
    })
    .eq('id', id)
    .eq('tenant_id', input.tenantId)

  if (error) return { success: false, error: 'Erro ao atualizar profissional.' }

  // Sincroniza serviços
  if (input.serviceIds !== undefined) {
    await supabase.from('professional_services').delete().eq('professional_id', id)
    if (input.serviceIds.length > 0) {
      await supabase.from('professional_services').insert(
        input.serviceIds.map((service_id) => ({ professional_id: id, service_id }))
      )
    }
  }

  const slug = await getTenantSlug(input.tenantId)
  revalidatePath(`/admin/${slug}/configuracoes/profissionais`)
  return { success: true }
}

export async function deleteProfessional(id: string, tenantId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('professionals')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { success: false, error: 'Erro ao excluir profissional.' }

  const slug = await getTenantSlug(tenantId)
  revalidatePath(`/admin/${slug}/configuracoes/profissionais`)
  return { success: true }
}

export type ScheduleInput = {
  day: DayOfWeek
  isWorking: boolean
  startTime: string
  endTime: string
  breakStartTime?: string | null
  breakEndTime?: string | null
}

export async function saveProfessionalSchedule(
  professionalId: string,
  tenantId: string,
  schedules: ScheduleInput[]
) {
  const supabase = await createClient()

  // Upsert completo da semana
  const { error } = await supabase.from('professional_schedules').upsert(
    schedules.map((s) => ({
      professional_id: professionalId,
      day: s.day,
      is_working: s.isWorking,
      start_time: s.startTime,
      end_time: s.endTime,
      break_start_time: s.breakStartTime ?? null,
      break_end_time: s.breakEndTime ?? null,
    })),
    { onConflict: 'professional_id,day' }
  )

  if (error) return { success: false, error: 'Erro ao salvar horários.' }

  const slug = await getTenantSlug(tenantId)
  revalidatePath(`/admin/${slug}/configuracoes/profissionais`)
  return { success: true }
}

async function getTenantSlug(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('slug').eq('id', tenantId).single()
  return data?.slug ?? ''
}

export async function createProfessionalAccount(
  professionalId: string,
  tenantId: string,
  email: string,
  password: string,
) {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Busca o profissional para obter o nome e verificar se já tem conta
  const { data: pro, error: proError } = await supabase
    .from('professionals')
    .select('id, name, user_id')
    .eq('id', professionalId)
    .eq('tenant_id', tenantId)
    .single()

  if (proError || !pro) return { success: false, error: 'Profissional não encontrado.' }
  if (pro.user_id) return { success: false, error: 'Este profissional já possui uma conta.' }

  // Cria o usuário na autenticação (sem precisar confirmar e-mail)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    if (authError?.message?.toLowerCase().includes('already')) {
      return { success: false, error: 'Este e-mail já está em uso.' }
    }
    return { success: false, error: 'Erro ao criar credenciais. Tente novamente.' }
  }

  const userId = authData.user.id

  // Cria registro na tabela users
  const { error: userError } = await admin
    .from('users')
    .insert({ id: userId, full_name: pro.name })

  if (userError) {
    // Faz rollback do auth user para não deixar lixo
    await admin.auth.admin.deleteUser(userId)
    return { success: false, error: 'Erro ao criar perfil do usuário.' }
  }

  // Cria a role adm_basico vinculada ao tenant
  const { error: roleError } = await admin
    .from('user_roles')
    .insert({ user_id: userId, tenant_id: tenantId, role: 'adm_basico' })

  if (roleError) {
    await admin.auth.admin.deleteUser(userId)
    return { success: false, error: 'Erro ao atribuir permissões.' }
  }

  // Vincula o user_id ao profissional
  const { error: linkError } = await supabase
    .from('professionals')
    .update({ user_id: userId })
    .eq('id', professionalId)
    .eq('tenant_id', tenantId)

  if (linkError) {
    // Não faz rollback — usuário foi criado, mas log o problema
    return { success: false, error: 'Conta criada, mas falha ao vincular ao profissional.' }
  }

  const slug = await getTenantSlug(tenantId)
  revalidatePath(`/admin/${slug}/configuracoes/profissionais`)
  return { success: true }
}
