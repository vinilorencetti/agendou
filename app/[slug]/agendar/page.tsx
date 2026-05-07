import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTenantBySlug, getTenantServices, getTenantProfessionals } from '@/lib/queries/tenants'
import BookingFlow from './booking-flow'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  return { title: tenant ? `Agendar — ${tenant.name}` : 'Agendar' }
}

export default async function AgendarPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const [services, professionals] = await Promise.all([
    getTenantServices(tenant.id),
    getTenantProfessionals(tenant.id),
  ])

  if (services.length === 0 || professionals.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-medium">Agendamento indisponível no momento.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-brand-secondary)' }}>
            Este negócio ainda está configurando seus serviços.
          </p>
          <a href={`/${slug}`} className="mt-4 inline-block text-sm underline">
            ← Voltar
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <a href={`/${slug}`} className="text-sm opacity-60 hover:opacity-100">←</a>
        <div>
          <p className="text-xs opacity-60">Agendamento</p>
          <p className="font-semibold">{tenant.name}</p>
        </div>
      </div>

      <BookingFlow
        tenantId={tenant.id}
        tenantSlug={slug}
        services={services}
        professionals={professionals}
      />
    </main>
  )
}
