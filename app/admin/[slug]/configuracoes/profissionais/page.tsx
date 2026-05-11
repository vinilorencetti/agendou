import type { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { getProfessionals } from '@/lib/queries/professionals'
import { getServices } from '@/lib/queries/services'
import { createClient } from '@/lib/supabase/server'
import ProfessionalsManager from './professionals-manager'

export const metadata: Metadata = { title: 'Profissionais' }

type Props = { params: Promise<{ slug: string }> }

export default async function ProfissionaisPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [professionals, services, profileResult] = await Promise.all([
    getProfessionals(tenant.id),
    getServices(tenant.id),
    supabase.from('users').select('full_name').eq('id', user!.id).maybeSingle(),
  ])

  // Verifica se o dono já tem um profissional vinculado
  const ownerHasProfessional = professionals.some((p) => p.user_id === user!.id)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--agendou-text)' }}>Profissionais</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
          {professionals.length} profissional{professionals.length !== 1 ? 'is' : ''} cadastrado{professionals.length !== 1 ? 's' : ''}
        </p>
      </div>
      <ProfessionalsManager
        tenantId={tenant.id}
        initialProfessionals={professionals}
        services={services}
        ownerName={profileResult.data?.full_name ?? ''}
        ownerUserId={user!.id}
        ownerHasProfessional={ownerHasProfessional}
      />
    </div>
  )
}
