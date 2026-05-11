import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'

export const metadata: Metadata = { title: 'Dashboard' }

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ welcome?: string }>
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendente', in_progress: 'Em atendimento',
  completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu',
}
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed:   { bg: 'rgba(59,130,246,0.15)',  text: '#60A5FA' },
  pending:     { bg: 'rgba(234,179,8,0.15)',   text: '#FACC15' },
  in_progress: { bg: 'rgba(34,197,94,0.15)',   text: '#4ADE80' },
  completed:   { bg: 'rgba(255,255,255,0.08)', text: '#9CA3AF' },
  cancelled:   { bg: 'rgba(239,68,68,0.15)',   text: '#F87171' },
  no_show:     { bg: 'rgba(167,139,250,0.15)', text: '#A78BFA' },
}

const TZ = 'America/Sao_Paulo'

export default async function AdminDashboardPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { welcome } = await searchParams

  const supabase = await createClient()
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return null

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: TZ })
  const currentMonth = today.slice(0, 7)
  const [year, mon] = currentMonth.split('-').map(Number)
  const firstOfMonth = `${currentMonth}-01`
  const lastOfMonth = new Date(year, mon, 0).toISOString().split('T')[0]

  const [
    { data: todayAppts },
    { data: upcomingAppts },
    { count: pendingCount },
    { data: monthRevenue },
    { count: clientCount },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, starts_at, ends_at, status, services(name), professionals(name), clients(full_name)')
      .eq('tenant_id', tenant.id)
      .gte('starts_at', `${today}T00:00:00Z`)
      .lte('starts_at', `${today}T23:59:59Z`)
      .not('status', 'in', '("cancelled","no_show")')
      .order('starts_at'),

    supabase
      .from('appointments')
      .select('id, starts_at, status, services(name), professionals(name), clients(full_name)')
      .eq('tenant_id', tenant.id)
      .gt('starts_at', `${today}T23:59:59Z`)
      .not('status', 'in', '("cancelled","no_show")')
      .order('starts_at')
      .limit(5),

    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('status', 'pending'),

    supabase
      .from('financial_entries')
      .select('amount')
      .eq('tenant_id', tenant.id)
      .eq('type', 'income')
      .eq('status', 'paid')
      .gte('due_date', firstOfMonth)
      .lte('due_date', lastOfMonth),

    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id),
  ])

  const totalRevenue = (monthRevenue ?? []).reduce((s, e) => s + e.amount, 0)
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })
  }

  const monthLabel = new Date(year, mon - 1, 15).toLocaleDateString('pt-BR', { month: 'long', timeZone: TZ })

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ,
  })

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header com identidade ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #1E1040 100%)', border: '1px solid rgba(124,58,237,0.25)' }}
      >
        {/* Decoração */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20"
          style={{ background: 'var(--agendou-gradient)' }} />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-20 w-20 rounded-full opacity-10"
          style={{ background: 'var(--agendou-gradient)' }} />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium capitalize" style={{ color: 'rgba(196,181,253,0.7)' }}>{todayFormatted}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight" style={{ color: '#F8F7FF' }}>
              {tenant.name}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>
              agendou.com.br/{slug}
            </p>
          </div>
          <Link
            href={`/admin/${slug}/agenda`}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition-all active:scale-[0.98] hover:opacity-90"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            Ver agenda
          </Link>
        </div>
      </div>

      {welcome === '1' && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          <p className="font-semibold" style={{ color: '#4ADE80' }}>🎉 Bem-vindo ao Agendou!</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
            Seu negócio foi criado com sucesso. Sua página pública já está disponível em{' '}
            <a href={`/${slug}`} target="_blank" className="underline" style={{ color: '#4ADE80' }}>
              agendou.com.br/{slug}
            </a>.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Agendamentos hoje" value={String(todayAppts?.length ?? 0)}
          href={`/admin/${slug}/agenda`} />
        <StatCard label="Pendentes" value={String(pendingCount ?? 0)}
          valueStyle={pendingCount ? { color: '#FACC15' } : undefined}
          href={`/admin/${slug}/agenda`} />
        <StatCard label={`Receita — ${monthLabel}`} value={fmt.format(totalRevenue)}
          valueStyle={{ color: '#4ADE80' }}
          href={`/admin/${slug}/financeiro`} />
        <StatCard label="Clientes cadastrados" value={String(clientCount ?? 0)}
          href={`/admin/${slug}/clientes`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Agenda do dia */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--agendou-border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--agendou-text)' }}>Hoje</h2>
            <Link href={`/admin/${slug}/agenda`} className="text-xs transition-colors" style={{ color: 'var(--agendou-text-faint)' }}>
              Ver agenda →
            </Link>
          </div>
          {!todayAppts || todayAppts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
              Nenhum agendamento para hoje.
            </p>
          ) : (
            <ul>
              {todayAppts.map((a, i) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={i > 0 ? { borderTop: '1px solid var(--agendou-border)' } : {}}
                >
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--agendou-text)' }}>{fmtTime(a.starts_at)}</p>
                    <p className="text-[10px]" style={{ color: 'var(--agendou-text-faint)' }}>{fmtTime(a.ends_at)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--agendou-text)' }}>{(a.clients as any)?.full_name}</p>
                    <p className="truncate text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
                      {(a.services as any)?.name} · {(a.professionals as any)?.name}
                    </p>
                  </div>
                  {(() => {
                    const st = STATUS_COLORS[a.status]
                    return (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: st?.bg ?? 'rgba(255,255,255,0.08)', color: st?.text ?? 'var(--agendou-text-muted)' }}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>
                    )
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Próximos agendamentos */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--agendou-border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--agendou-text)' }}>Próximos agendamentos</h2>
          </div>
          {!upcomingAppts || upcomingAppts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
              Nenhum agendamento futuro.
            </p>
          ) : (
            <ul>
              {upcomingAppts.map((a, i) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={i > 0 ? { borderTop: '1px solid var(--agendou-border)' } : {}}
                >
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-medium capitalize" style={{ color: 'var(--agendou-text-muted)' }}>{fmtDate(a.starts_at)}</p>
                    <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--agendou-text)' }}>{fmtTime(a.starts_at)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--agendou-text)' }}>{(a.clients as any)?.full_name}</p>
                    <p className="truncate text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
                      {(a.services as any)?.name} · {(a.professionals as any)?.name}
                    </p>
                  </div>
                  {(() => {
                    const st = STATUS_COLORS[a.status]
                    return (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: st?.bg ?? 'rgba(255,255,255,0.08)', color: st?.text ?? 'var(--agendou-text-muted)' }}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>
                    )
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Novo agendamento', href: `/admin/${slug}/agenda`, icon: '📅' },
          { label: 'Gerenciar serviços', href: `/admin/${slug}/configuracoes/servicos`, icon: '✂️' },
          { label: 'Gerenciar equipe', href: `/admin/${slug}/configuracoes/profissionais`, icon: '👥' },
          { label: 'Ver página pública', href: `/${slug}`, icon: '↗', external: true },
        ].map((s) => (
          <Link
            key={s.href}
            href={s.href}
            target={s.external ? '_blank' : undefined}
            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]"
            style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)', color: 'var(--agendou-text-muted)' }}
          >
            <span>{s.icon}</span>
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, valueStyle, href }: {
  label: string; value: string; valueStyle?: React.CSSProperties; href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl p-4 transition-all active:scale-[0.98]"
      style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
    >
      <p className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>{label}</p>
      <p className="mt-1.5 text-2xl font-bold" style={{ color: 'var(--agendou-text)', ...valueStyle }}>{value}</p>
    </Link>
  )
}
