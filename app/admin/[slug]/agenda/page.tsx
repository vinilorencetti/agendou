import type { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { getServices } from '@/lib/queries/services'
import { createClient } from '@/lib/supabase/server'
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

  const [{ data: appointments }, { data: professionals }, services] = await Promise.all([
    supabase
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
      .order('starts_at'),

    supabase
      .from('professionals')
      .select('id, name, avatar_url')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('display_order'),

    getServices(tenant.id),
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
        tenantId={tenant.id}
        slug={slug}
      />
    </div>
  )
}
