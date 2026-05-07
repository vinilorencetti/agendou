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
          .select(`id, starts_at, ends_at, status, price_snapshot, services(name), professionals(name)`)
          .eq('tenant_id', tenant.id)
          .eq('client_id', clientRecord.id)
          .in('status', ['pending', 'confirmed'])
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(3)
      : { data: [] }

    const firstName = (profile?.full_name ?? user.email ?? '').split(' ')[0]

    const STATUS: Record<string, { label: string; color: string }> = {
      confirmed: { label: 'Confirmado', color: 'text-emerald-600 bg-emerald-50' },
      pending:   { label: 'Pendente',   color: 'text-amber-600 bg-amber-50' },
    }

    return (
      <div className="mx-auto max-w-lg pb-24">
        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden px-5 pb-8 pt-12"
          style={{ background: `linear-gradient(135deg, var(--color-brand) 0%, color-mix(in srgb, var(--color-brand) 80%, black) 100%)` }}
        >
          {/* Decorativo */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style={{ backgroundColor: 'var(--color-brand-foreground)' }} />
          <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full opacity-10"
            style={{ backgroundColor: 'var(--color-brand-foreground)' }} />

          <div className="relative flex items-center gap-4">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-14 w-14 rounded-2xl object-cover shadow-lg ring-2 ring-white/20"
              />
            ) : (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-lg ring-2 ring-white/20"
                style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--color-brand-foreground)' }}
              >
                {tenant.name[0]}
              </div>
            )}
            <div style={{ color: 'var(--color-brand-foreground)' }}>
              <p className="text-sm opacity-75">{tenant.name}</p>
              <p className="text-xl font-bold tracking-tight">Olá, {firstName} 👋</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 space-y-6">
          {/* ── CTA Agendar ── */}
          <a
            href={`/${slug}/agendar`}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-bold shadow-lg shadow-black/10 transition-all active:scale-[0.98] hover:shadow-xl"
            style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
            </svg>
            Agendar horário
          </a>

          {/* ── Próximos agendamentos ── */}
          {upcomingAppointments && upcomingAppointments.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Próximos</h2>
                <a href={`/${slug}/meus-agendamentos`} className="text-xs font-medium" style={{ color: 'var(--color-brand)' }}>
                  Ver todos →
                </a>
              </div>
              <ul className="space-y-2.5">
                {upcomingAppointments.map((appt) => {
                  const service = appt.services as { name: string } | null
                  const pro = appt.professionals as { name: string } | null
                  const startDate = new Date(appt.starts_at)
                  const dateLabel = startDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIMEZONE })
                  const timeLabel = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })
                  const st = STATUS[appt.status]
                  return (
                    <li key={appt.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                      <div>
                        <p className="font-semibold text-gray-900">{service?.name}</p>
                        <p className="mt-0.5 text-sm text-gray-500">{dateLabel} · {timeLabel}</p>
                        {pro && <p className="mt-0.5 text-xs text-gray-400">{pro.name}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st?.color ?? 'text-gray-500 bg-gray-100'}`}>
                          {st?.label ?? appt.status}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{fmt.format(appt.price_snapshot)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* ── Serviços ── */}
          {services.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Serviços</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {services.map((service) => (
                  <div key={service.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <p className="font-semibold text-gray-900 leading-snug">{service.name}</p>
                    <p className="mt-1 text-xs text-gray-400">{service.duration_min} min</p>
                    <p className="mt-2 text-sm font-bold" style={{ color: 'var(--color-brand)' }}>
                      {fmt.format(service.price)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Contato ── */}
          {(whatsappUrl || instagramUrl) && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Contato</h2>
              <div className="flex gap-2.5">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
                  >
                    <span className="text-lg">💬</span> WhatsApp
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
                  >
                    <span className="text-lg">📸</span> Instagram
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        <BottomNav slug={slug} />
      </div>
    )
  }

  // ─── LANDING (não autenticado) ────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden px-5 pb-10 pt-16 text-center"
        style={{ background: `linear-gradient(160deg, var(--color-brand) 0%, color-mix(in srgb, var(--color-brand) 75%, black) 100%)` }}
      >
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-10"
          style={{ backgroundColor: 'var(--color-brand-foreground)' }} />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
          style={{ backgroundColor: 'var(--color-brand-foreground)' }} />

        <div className="relative">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover shadow-xl ring-4 ring-white/20"
            />
          ) : (
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold shadow-xl ring-4 ring-white/20"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--color-brand-foreground)' }}
            >
              {tenant.name[0]}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-brand-foreground)' }}>
            {tenant.name}
          </h1>
          {tenant.description && (
            <p className="mt-2 text-sm leading-relaxed opacity-80" style={{ color: 'var(--color-brand-foreground)' }}>
              {tenant.description}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3">
            <a
              href={`/${slug}/entrar?redirect=/${slug}/agendar`}
              className="mx-auto block w-full max-w-xs rounded-2xl bg-white py-4 text-[15px] font-bold shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
              style={{ color: 'var(--color-brand)' }}
            >
              Entrar e agendar
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
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Serviços */}
        {services.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Nossos serviços</h2>
            <ul className="space-y-2">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{service.name}</p>
                    {service.description && (
                      <p className="mt-0.5 text-xs text-gray-400">{service.description}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">{service.duration_min} min</p>
                  </div>
                  <span className="shrink-0 ml-4 text-sm font-bold" style={{ color: 'var(--color-brand)' }}>
                    {fmt.format(service.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Profissionais */}
        {professionals.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Nossa equipe</h2>
            <ul className="space-y-2">
              {professionals.map((pro) => (
                <li key={pro.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                  {pro.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pro.avatar_url} alt={pro.name} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)', opacity: 0.85 }}
                    >
                      {pro.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{pro.name}</p>
                    {pro.bio && <p className="text-xs text-gray-400">{pro.bio}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Contato */}
        {(whatsappUrl || instagramUrl) && (
          <div className="flex gap-2.5">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
              >
                <span className="text-lg">💬</span> WhatsApp
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
              >
                <span className="text-lg">📸</span> Instagram
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
