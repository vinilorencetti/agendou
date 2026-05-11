import type { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { getServices } from '@/lib/queries/services'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AgendaDayView from './agenda-day-view'

export const metadata: Metadata = { title: 'Agenda' }

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string }>
}

export default async function AgendaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { date: dateParam } = await searchParams

  const tenant = await getTenantBySlug(slug)
  if (!tenant) return null

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const date = dateParam ?? today

  const supabase = await createClient()
  const admin = createAdminClient()

  // Detecta papel do usuário logado
  const { data: { user } } = await supabase.auth.getUser()
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user!.id)
    .eq('tenant_id', tenant.id)
    .in('role', ['adm_geral', 'adm_basico'])
    .eq('is_active', true)
    .maybeSingle()

  const isBasico = roleData?.role === 'adm_basico'

  // Se adm_basico, encontra o profissional vinculado
  let myProfessionalId: string | undefined
  if (isBasico) {
    const { data: pro } = await admin
      .from('professionals')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user!.id)
      .maybeSingle()
    myProfessionalId = pro?.id ?? undefined
  }

  // Usa admin client para garantir leitura mesmo com RLS restritivo
  const appointmentsQuery = admin
    .from('appointments')
    .select(`
      id, starts_at, ends_at, status, notes, internal_notes, price_snapshot,
      services(name),
      professionals(id, name, avatar_url),
      clients(full_name, phone)
    `)
    .eq('tenant_id', tenant.id)
    .gte('starts_at', `${date}T00:00:00Z`)
    .lte('starts_at', `${date}T23:59:59Z`)
    .order('starts_at')

  // adm_basico só vê seus próprios agendamentos
  if (isBasico && myProfessionalId) {
    appointmentsQuery.eq('professional_id', myProfessionalId)
  }

  const professionalsQuery = admin
    .from('professionals')
    .select('id, name, avatar_url')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order')

  // adm_basico só vê a própria coluna
  if (isBasico && myProfessionalId) {
    professionalsQuery.eq('id', myProfessionalId)
  }

  const [{ data: appointments }, { data: professionals }, services, { data: clients }] = await Promise.all([
    appointmentsQuery,
    professionalsQuery,
    getServices(tenant.id),
    supabase
      .from('clients')
      .select('id, full_name, phone, email')
      .eq('tenant_id', tenant.id)
      .order('full_name')
      .limit(500),
  ])

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold" style={{ color: 'var(--agendou-text)' }}>Agenda</h1>
      <AgendaDayView
        date={date}
        today={today}
        appointments={appointments ?? []}
        professionals={professionals ?? []}
        services={services}
        clients={clients ?? []}
        tenantId={tenant.id}
        slug={slug}
        isBasico={isBasico}
        myProfessionalId={myProfessionalId}
      />
    </div>
  )
}
