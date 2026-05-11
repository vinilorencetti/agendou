'use server'

import { createClient } from '@/lib/supabase/server'
import type { AppointmentStatus } from '@/types/database'

export type BookingInput = {
  tenantId: string
  professionalId: string
  serviceId: string
  startUtc: string
  endUtc: string
  // Dados do cliente
  clientName: string
  clientPhone?: string
  clientEmail?: string
  notes?: string
}

export type BookingResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string }

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const supabase = await createClient()

  // Busca preço e duração atuais do serviço (snapshot)
  const { data: service } = await supabase
    .from('services')
    .select('price, duration_min, name')
    .eq('id', input.serviceId)
    .single()

  if (!service) return { success: false, error: 'Serviço não encontrado.' }

  // Verifica se o slot ainda está disponível (race condition)
  const { data: conflicting } = await supabase
    .from('appointments')
    .select('id')
    .eq('professional_id', input.professionalId)
    .neq('status', 'cancelled')
    .neq('status', 'no_show')
    .lt('starts_at', input.endUtc)
    .gt('ends_at', input.startUtc)
    .limit(1)

  if (conflicting && conflicting.length > 0) {
    return { success: false, error: 'Este horário acabou de ser reservado. Escolha outro.' }
  }

  // Busca ou cria o registro de cliente
  const { data: { user } } = await supabase.auth.getUser()

  let clientId: string

  if (user) {
    // Cliente logado — busca ou cria vinculado ao user
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('tenant_id', input.tenantId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      clientId = existing.id
    } else {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          tenant_id: input.tenantId,
          user_id: user.id,
          full_name: input.clientName,
          phone: input.clientPhone ?? null,
          email: input.clientEmail ?? null,
        })
        .select('id')
        .single()

      if (error || !newClient) return { success: false, error: 'Erro ao criar cadastro.' }
      clientId = newClient.id
    }
  } else {
    // Guest — cria cliente sem user_id
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        tenant_id: input.tenantId,
        user_id: null,
        full_name: input.clientName,
        phone: input.clientPhone ?? null,
        email: input.clientEmail ?? null,
      })
      .select('id')
      .single()

    if (error || !newClient) return { success: false, error: 'Erro ao criar cadastro.' }
    clientId = newClient.id
  }

  // Cria o agendamento
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      tenant_id: input.tenantId,
      client_id: clientId,
      professional_id: input.professionalId,
      service_id: input.serviceId,
      status: 'confirmed',
      starts_at: input.startUtc,
      ends_at: input.endUtc,
      price_snapshot: service.price,
      duration_min_snapshot: service.duration_min,
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (apptError || !appointment) {
    return { success: false, error: 'Erro ao confirmar agendamento.' }
  }

  // Lança receita financeira automaticamente
  await supabase.from('financial_entries').insert({
    tenant_id: input.tenantId,
    appointment_id: appointment.id,
    professional_id: input.professionalId,
    type: 'income',
    status: 'pending',
    description: `${service.name} — ${input.clientName}`,
    amount: service.price,
    due_date: input.startUtc.split('T')[0],
    category: 'service',
  })

  return { success: true, appointmentId: appointment.id }
}

// ─── Cancelamento pelo cliente ────────────────────────────────────────────────

export async function cancelAppointmentAsClient(
  appointmentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca agendamento com política do tenant
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, starts_at, status, tenant_id, tenants(cancellation_policy_hours), clients(user_id)')
    .eq('id', appointmentId)
    .single()

  if (!appt) return { success: false, error: 'Agendamento não encontrado.' }
  if (appt.status === 'cancelled') return { success: false, error: 'Agendamento já cancelado.' }
  if (appt.status === 'completed') return { success: false, error: 'Não é possível cancelar um atendimento concluído.' }

  // Verifica se o cliente é o dono do agendamento
  const client = appt.clients as { user_id: string | null } | null
  if (user && client?.user_id !== user.id) {
    return { success: false, error: 'Você não tem permissão para cancelar este agendamento.' }
  }

  // Aplica política de cancelamento
  const tenant = appt.tenants as { cancellation_policy_hours: number } | null
  const policyHours = tenant?.cancellation_policy_hours ?? 2
  const deadline = new Date(appt.starts_at).getTime() - policyHours * 60 * 60 * 1000

  if (Date.now() > deadline) {
    return {
      success: false,
      error: `Cancelamento não permitido. O prazo mínimo é ${policyHours}h antes do horário marcado.`,
    }
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason ?? 'Cancelado pelo cliente',
    })
    .eq('id', appointmentId)

  if (error) return { success: false, error: 'Erro ao cancelar. Tente novamente.' }

  // Cancela a entrada financeira vinculada
  await supabase
    .from('financial_entries')
    .update({ status: 'cancelled' })
    .eq('appointment_id', appointmentId)

  return { success: true }
}

// ─── Gerenciamento pelo admin ─────────────────────────────────────────────────

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({
      status,
      ...(status === 'cancelled' && {
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? 'Cancelado pelo administrador',
      }),
    })
    .eq('id', appointmentId)

  if (error) return { success: false, error: 'Erro ao atualizar status.' }

  if (status === 'cancelled') {
    await supabase
      .from('financial_entries')
      .update({ status: 'cancelled' })
      .eq('appointment_id', appointmentId)
  }

  if (status === 'completed') {
    await supabase
      .from('financial_entries')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('appointment_id', appointmentId)
  }

  return { success: true }
}

export type ManualBookingInput = {
  tenantId: string
  professionalId: string
  serviceId: string
  startUtc: string
  endUtc: string
  // Ou clientId existente, ou dados para criar novo
  clientId?: string
  clientName?: string
  clientPhone?: string
  internalNotes?: string
}

export async function createManualBooking(
  input: ManualBookingInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: service } = await supabase
    .from('services')
    .select('price, duration_min, name')
    .eq('id', input.serviceId)
    .single()

  if (!service) return { success: false, error: 'Serviço não encontrado.' }

  // Verifica conflito
  const { data: conflict } = await supabase
    .from('appointments')
    .select('id')
    .eq('professional_id', input.professionalId)
    .neq('status', 'cancelled')
    .neq('status', 'no_show')
    .lt('starts_at', input.endUtc)
    .gt('ends_at', input.startUtc)
    .limit(1)

  if (conflict && conflict.length > 0) {
    return { success: false, error: 'Já existe um agendamento neste horário.' }
  }

  let clientId: string
  let clientDisplayName: string

  if (input.clientId) {
    // Usa cliente existente
    const { data: existing } = await supabase
      .from('clients')
      .select('id, full_name')
      .eq('id', input.clientId)
      .eq('tenant_id', input.tenantId)
      .single()

    if (!existing) return { success: false, error: 'Cliente não encontrado.' }
    clientId = existing.id
    clientDisplayName = existing.full_name
  } else {
    // Cria novo cliente (nome obrigatório)
    if (!input.clientName?.trim()) return { success: false, error: 'Nome do cliente é obrigatório.' }

    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        tenant_id: input.tenantId,
        full_name: input.clientName.trim(),
        phone: input.clientPhone?.trim() || null,
      })
      .select('id')
      .single()

    if (clientError || !newClient) return { success: false, error: 'Erro ao criar cliente.' }
    clientId = newClient.id
    clientDisplayName = input.clientName.trim()
  }

  const { error } = await supabase.from('appointments').insert({
    tenant_id: input.tenantId,
    client_id: clientId,
    professional_id: input.professionalId,
    service_id: input.serviceId,
    status: 'confirmed',
    starts_at: input.startUtc,
    ends_at: input.endUtc,
    price_snapshot: service.price,
    duration_min_snapshot: service.duration_min,
    internal_notes: input.internalNotes ?? null,
  })

  if (error) return { success: false, error: 'Erro ao criar agendamento.' }

  await supabase.from('financial_entries').insert({
    tenant_id: input.tenantId,
    professional_id: input.professionalId,
    type: 'income',
    status: 'pending',
    description: `${service.name} — ${clientDisplayName}`,
    amount: service.price,
    due_date: input.startUtc.split('T')[0],
    category: 'service',
  })

  return { success: true }
}

export async function createBlockedTime(input: {
  professionalId: string
  startAt: string
  endAt: string
  reason?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from('professional_blocked_times').insert({
    professional_id: input.professionalId,
    start_at: input.startAt,
    end_at: input.endAt,
    reason: input.reason ?? null,
  })

  if (error) return { success: false, error: 'Erro ao bloquear horário.' }
  return { success: true }
}

export async function deleteBlockedTime(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('professional_blocked_times').delete().eq('id', id)
  if (error) return { success: false, error: 'Erro ao remover bloqueio.' }
  return { success: true }
}
