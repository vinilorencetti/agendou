import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantServices, getTenantProfessionals } from '@/lib/queries/tenants'
import BottomNav from '@/components/ui/bottom-nav'
import { TIMEZONE } from '@/lib/availability'

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [services, professionals] = await Promise.all([
    getTenantServices(tenant.id),
    getTenantProfessionals(tenant.id),
  ])

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  // Build social links
  const whatsappUrl = tenant.whatsapp
    ? `https://wa.me/${tenant.whatsapp.replace(/\D/g, '')}`
    : null
  const instagramUrl = tenant.instagram
    ? `https://instagram.com/${tenant.instagram.replace('@', '')}`
    : null

  // ─── DASHBOARD (autenticado) ──────────────────────────────────────────────
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: upcomingAppointments } = clientRecord
      ? await supabase
          .from('appointments')
          .select(`
            id, starts_at, ends_at, status, price_snapshot,
            services(name),
            professionals(name)
          `)
          .eq('tenant_id', tenant.id)
          .eq('client_id', clientRecord.id)
          .in('status', ['pending', 'confirmed'])
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(3)
      : { data: [] }

    const firstName = (profile?.full_name ?? user.email ?? '').split(' ')[0]

    const STATUS_LABELS: Record<string, string> = {
      confirmed: 'Confirmado',
      pending: 'Pendente',
    }
    const STATUS_COLORS: Record<string, string> = {
      confirmed: 'bg-blue-50 text-blue-700',
      pending: 'bg-amber-50 text-amber-700',
    }

    return (
      <main className="mx-auto max-w-lg pb-24">
        {/* Hero */}
        <div
          className="px-5 pb-6 pt-10"
          style={{ backgroundColor: 'var(--color-brand)' }}
        >
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-12 w-12 rounded-xl object-cover shadow-md"
              />
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-md"
                style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: 'var(--color-brand-foreground)' }}
              >
                {tenant.name[0]}
              </div>
            )}
            <div style={{ color: 'var(--color-brand-foreground)' }}>
              <p className="text-xs opacity-75">{tenant.name}</p>
              <p className="text-lg font-bold">Olá, {firstName} 👋</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-5">
          {/* Agendar CTA */}
          <a
            href={`/${slug}/agendar`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow-md transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
            </svg>
            Agendar horário
          </a>

          {/* Agendamentos próximos */}
          {upcomingAppointments && upcomingAppointments.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Próximos agendamentos
              </h2>
              <ul className="flex flex-col gap-3">
                {upcomingAppointments.map((appt) => {
                  const service = appt.services as { name: string } | null
                  const pro = appt.professionals as { name: string } | null
                  const startDate = new Date(appt.starts_at)
                  const dateLabel = startDate.toLocaleDateString('pt-BR', {
                    weekday: 'short', day: 'numeric', month: 'short', timeZone: TIMEZONE,
                  })
                  const timeLabel = startDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
                  })
                  return (
                    <li key={appt.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{service?.name}</p>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {dateLabel} às {timeLabel}
                          </p>
                          {pro && (
                            <p className="mt-0.5 text-xs text-gray-400">{pro.name}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[appt.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABELS[appt.status] ?? appt.status}
                          </span>
                          <span className="text-sm font-bold">{fmt.format(appt.price_snapshot)}</span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <a
                href={`/${slug}/meus-agendamentos`}
                className="mt-3 block text-center text-sm font-medium"
                style={{ color: 'var(--color-brand)' }}
              >
                Ver todos →
              </a>
            </section>
          )}

          {/* Serviços */}
          {services.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Serviços
              </h2>
              <ul className="grid grid-cols-2 gap-3">
                {services.map((service) => (
                  <li
                    key={service.id}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <p className="font-medium leading-tight">{service.name}</p>
                    <p className="mt-1 text-xs text-gray-400">{service.duration_min} min</p>
                    <p className="mt-2 text-sm font-bold" style={{ color: 'var(--color-brand)' }}>
                      {fmt.format(service.price)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Links sociais */}
          {(whatsappUrl || instagramUrl) && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Contato
              </h2>
              <div className="flex gap-3">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border bg-white py-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <span className="text-lg">💬</span> WhatsApp
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border bg-white py-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <span className="text-lg">📸</span> Instagram
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        <BottomNav slug={slug} />
      </main>
    )
  }

  // ─── LANDING (não autenticado) ────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-lg">
      {/* Hero */}
      <div
        className="px-5 pb-10 pt-16 text-center"
        style={{ backgroundColor: 'var(--color-brand)' }}
      >
        {tenant.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.logo_url}
            alt={tenant.name}
            className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover shadow-lg"
          />
        ) : (
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold shadow-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: 'var(--color-brand-foreground)' }}
          >
            {tenant.name[0]}
          </div>
        )}
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-brand-foreground)' }}>
          {tenant.name}
        </h1>
        {tenant.description && (
          <p className="mt-2 text-sm opacity-80" style={{ color: 'var(--color-brand-foreground)' }}>
            {tenant.description}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={`/${slug}/entrar?redirect=/${slug}/agendar`}
            className="mx-auto block w-full max-w-xs rounded-2xl py-4 text-base font-bold shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: 'var(--color-brand-foreground)', border: '2px solid rgba(255,255,255,0.3)' }}
          >
            Entrar para agendar
          </a>
          <a
            href={`/${slug}/cadastro?redirect=/${slug}/agendar`}
            className="mx-auto block text-sm font-medium opacity-80"
            style={{ color: 'var(--color-brand-foreground)' }}
          >
            Não tem conta? Criar agora →
          </a>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Serviços */}
        {services.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Nossos serviços
            </h2>
            <ul className="flex flex-col gap-2">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    {service.description && (
                      <p className="mt-0.5 text-xs text-gray-400">{service.description}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">{service.duration_min} min</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold" style={{ color: 'var(--color-brand)' }}>
                    {fmt.format(service.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Profissionais */}
        {professionals.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Equipe
            </h2>
            <ul className="flex flex-col gap-2">
              {professionals.map((pro) => (
                <li key={pro.id} className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
                  {pro.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pro.avatar_url}
                      alt={pro.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)', opacity: 0.8 }}
                    >
                      {pro.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{pro.name}</p>
                    {pro.bio && <p className="text-xs text-gray-400">{pro.bio}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Links sociais */}
        {(whatsappUrl || instagramUrl) && (
          <div className="flex gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border bg-white py-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50"
              >
                <span className="text-lg">💬</span> WhatsApp
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border bg-white py-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50"
              >
                <span className="text-lg">📸</span> Instagram
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
