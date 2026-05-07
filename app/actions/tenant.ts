'use server'

import { createClient } from '@/lib/supabase/server'
import { generateSlug, isValidSlug, RESERVED_SLUGS } from '@/lib/slug'
import { redirect } from 'next/navigation'

export type SlugCheckResult =
  | { available: true }
  | { available: false; reason: 'reserved' | 'taken' | 'invalid' }

export async function checkSlugAvailability(slug: string): Promise<SlugCheckResult> {
  if (!isValidSlug(slug)) return { available: false, reason: 'invalid' }
  if (RESERVED_SLUGS.has(slug)) return { available: false, reason: 'reserved' }

  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return data ? { available: false, reason: 'taken' } : { available: true }
}

// Gera um slug único — se o base estiver ocupado, tenta base-2, base-3 …
async function resolveUniqueSlug(base: string): Promise<string> {
  const supabase = await createClient()
  let candidate = base
  let attempt = 2

  while (true) {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!data) return candidate
    candidate = `${base}-${attempt++}`
  }
}

export type CreateTenantInput = {
  businessName: string
  slug: string
  phone?: string
  addressCity?: string
  addressState?: string
}

export type CreateTenantResult =
  | { success: true; slug: string }
  | { success: false; error: string }

export async function createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Faça login novamente.' }

  // Verifica se o usuário já tem um tenant
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('role', 'adm_geral')
    .maybeSingle()

  if (existingRole) return { success: false, error: 'Você já possui um negócio cadastrado.' }

  const baseSlug = generateSlug(input.slug || input.businessName)
  const slugCheck = await checkSlugAvailability(baseSlug)
  const finalSlug = slugCheck.available ? baseSlug : await resolveUniqueSlug(baseSlug)

  // Insere tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: input.businessName.trim(),
      slug: finalSlug,
      phone: input.phone?.trim() || null,
      address_city: input.addressCity?.trim() || null,
      address_state: input.addressState?.trim() || null,
      status: 'active',
      plan: 'starter',
    })
    .select('id, slug')
    .single()

  if (tenantError || !tenant) {
    return { success: false, error: 'Erro ao criar negócio. Tente novamente.' }
  }

  // Cria o role adm_geral para o usuário
  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: user.id,
    tenant_id: tenant.id,
    role: 'adm_geral',
    is_active: true,
  })

  if (roleError) {
    // Rollback manual: remove o tenant criado
    await supabase.from('tenants').delete().eq('id', tenant.id)
    return { success: false, error: 'Erro ao configurar permissões. Tente novamente.' }
  }

  // Cria horário de funcionamento padrão (seg-sex 09h–18h, sáb 09h–14h)
  const defaultHours = [
    { day: 'monday',    is_open: true,  open_time: '09:00', close_time: '18:00' },
    { day: 'tuesday',   is_open: true,  open_time: '09:00', close_time: '18:00' },
    { day: 'wednesday', is_open: true,  open_time: '09:00', close_time: '18:00' },
    { day: 'thursday',  is_open: true,  open_time: '09:00', close_time: '18:00' },
    { day: 'friday',    is_open: true,  open_time: '09:00', close_time: '18:00' },
    { day: 'saturday',  is_open: true,  open_time: '09:00', close_time: '14:00' },
    { day: 'sunday',    is_open: false, open_time: '09:00', close_time: '12:00' },
  ] as const

  await supabase.from('tenant_business_hours').insert(
    defaultHours.map((h) => ({ ...h, tenant_id: tenant.id }))
  )

  return { success: true, slug: tenant.slug }
}
