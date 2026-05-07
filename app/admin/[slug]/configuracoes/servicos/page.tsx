import type { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { getServices } from '@/lib/queries/services'
import ServicesManager from './services-manager'

export const metadata: Metadata = { title: 'Serviços' }

type Props = { params: Promise<{ slug: string }> }

export default async function ServicosPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return null

  const services = await getServices(tenant.id)

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Serviços</h1>
          <p className="mt-0.5 text-sm text-gray-500">{services.length} serviço{services.length !== 1 ? 's' : ''} cadastrado{services.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <ServicesManager tenantId={tenant.id} initialServices={services} />
    </div>
  )
}
