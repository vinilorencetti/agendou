import type { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { createClient } from '@/lib/supabase/server'
import BusinessHoursEditor from './business-hours-editor'

export const metadata: Metadata = { title: 'Horário de funcionamento' }

type Props = { params: Promise<{ slug: string }> }

export default async function HorariosPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return null

  const supabase = await createClient()
  const { data: hours } = await supabase
    .from('tenant_business_hours')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('day')

  return (
    <div className="max-w-lg">
      <h1 className="mb-2 text-xl font-semibold" style={{ color: 'var(--agendou-text)' }}>Horário de funcionamento</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
        Define quando clientes podem fazer agendamentos. Os profissionais têm horários próprios configurados separadamente.
      </p>
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}>
        <BusinessHoursEditor
          tenantId={tenant.id}
          slug={slug}
          initialHours={hours ?? []}
        />
      </div>
    </div>
  )
}
