import type { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { getProfessionals } from '@/lib/queries/professionals'
import { getServices } from '@/lib/queries/services'
import ProfessionalsManager from './professionals-manager'

export const metadata: Metadata = { title: 'Profissionais' }

type Props = { params: Promise<{ slug: string }> }

export default async function ProfissionaisPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return null

  const [professionals, services] = await Promise.all([
    getProfessionals(tenant.id),
    getServices(tenant.id),
  ])

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Profissionais</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {professionals.length} profissional{professionals.length !== 1 ? 'is' : ''} cadastrado{professionals.length !== 1 ? 's' : ''}
        </p>
      </div>
      <ProfessionalsManager
        tenantId={tenant.id}
        initialProfessionals={professionals}
        services={services}
      />
    </div>
  )
}
