import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTenantBySlug, getTenantServices, getTenantProfessionals } from '@/lib/queries/tenants'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return {}
  return {
    title: tenant.name,
    description: tenant.description ?? `Agende seu horário em ${tenant.name}`,
  }
}

export default async function TenantPublicPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const [services, professionals] = await Promise.all([
    getTenantServices(tenant.id),
    getTenantProfessionals(tenant.id),
  ])

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        {tenant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.logo_url}
            alt={`Logo ${tenant.name}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        {tenant.description && (
          <p className="text-sm text-gray-500">{tenant.description}</p>
        )}
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Serviços</h2>
        {services.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum serviço disponível.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  {service.description && (
                    <p className="text-sm text-gray-500">{service.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">{service.duration_min} min</p>
                </div>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(service.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Profissionais</h2>
        {professionals.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum profissional disponível.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {professionals.map((pro) => (
              <li key={pro.id} className="flex items-center gap-3 rounded-lg border p-4">
                {pro.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pro.avatar_url}
                    alt={pro.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                    {pro.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-medium">{pro.name}</p>
                  {pro.bio && <p className="text-sm text-gray-500">{pro.bio}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 text-center">
        <a
          href={`/${slug}/agendar`}
          className="inline-block rounded-xl px-8 py-4 text-sm font-bold shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
        >
          Agendar horário
        </a>
      </div>
    </main>
  )
}
