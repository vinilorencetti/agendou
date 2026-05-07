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
const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700',
  pending: 'bg-yellow-50 text-yellow-700',
  in_progress: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-400',
  no_show: 'bg-purple-50 text-purple-700',
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
    // Agendamentos de hoje com detalhes
    supabase
      .from('appointments')
      .select('id, starts_at, ends_at, status, services(name), professionals(name), clients(full_name)')
      .eq('tenant_id', tenant.id)
      .gte('starts_at', `${today}T00:00:00Z`)
      .lte('starts_at', `${today}T23:59:59Z`)
      .not('status', 'in', '("cancelled","no_show")')
      .order('starts_at'),

    // Próximos agendamentos (amanhã e depois)
    supabase
      .from('appointments')
      .select('id, starts_at, status, services(name), professionals(name), clients(full_name)')
      .eq('tenant_id', tenant.id)
      .gt('starts_at', `${today}T23:59:59Z`)
      .not('status', 'in', '("cancelled","no_show")')
      .order('starts_at')
      .limit(5),

    // Pendentes de confirmação
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('status', 'pending'),

    // Receita do mês (entradas pagas)
    supabase
      .from('financial_entries')
      .select('amount')
      .eq('tenant_id', tenant.id)
      .eq('type', 'income')
      .eq('status', 'paid')
      .gte('due_date', firstOfMonth)
      .lte('due_date', lastOfMonth),

    // Total de clientes
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

  return (
    <div className="flex flex-col gap-6">
      {welcome === '1' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-800">Bem-vindo ao Agendou!</p>
          <p className="mt-1 text-sm text-green-700">
            Seu negócio foi criado com sucesso. Sua página pública já está disponível em{' '}
            <a href={`/${slug}`} target="_blank" className="underline">agendou.com.br/{slug}</a>.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link href={`/admin/${slug}/agenda`}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Ver agenda
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Agendamentos hoje" value={String(todayAppts?.length ?? 0)}
          href={`/admin/${slug}/agenda`} />
        <StatCard label="Pendentes" value={String(pendingCount ?? 0)}
          valueColor={pendingCount ? 'text-yellow-600' : undefined}
          href={`/admin/${slug}/agenda`} />
        <StatCard label={`Receita — ${monthLabel}`} value={fmt.format(totalRevenue)}
          valueColor="text-green-600"
          href={`/admin/${slug}/financeiro`} />
        <StatCard label="Clientes cadastrados" value={String(clientCount ?? 0)}
          href={`/admin/${slug}/clientes`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agenda do dia */}
        <div className="rounded-xl border bg-white">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Hoje</h2>
            <Link href={`/admin/${slug}/agenda`} className="text-xs text-gray-400 hover:text-black">
              Ver agenda →
            </Link>
          </div>
          {!todayAppts || todayAppts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">
              Nenhum agendamento para hoje.
            </p>
          ) : (
            <ul className="divide-y">
              {todayAppts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-sm font-semibold tabular-nums">{fmtTime(a.starts_at)}</p>
                    <p className="text-[10px] text-gray-400">{fmtTime(a.ends_at)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{(a.clients as any)?.full_name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {(a.services as any)?.name} · {(a.professionals as any)?.name}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[a.status] ?? ''}`}>
                    {STATUS_LABELS[a.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Próximos agendamentos */}
        <div className="rounded-xl border bg-white">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Próximos agendamentos</h2>
          </div>
          {!upcomingAppts || upcomingAppts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">
              Nenhum agendamento futuro.
            </p>
          ) : (
            <ul className="divide-y">
              {upcomingAppts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-medium capitalize text-gray-500">{fmtDate(a.starts_at)}</p>
                    <p className="text-sm font-semibold tabular-nums">{fmtTime(a.starts_at)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{(a.clients as any)?.full_name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {(a.services as any)?.name} · {(a.professionals as any)?.name}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[a.status] ?? ''}`}>
                    {STATUS_LABELS[a.status]}
                  </span>
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
          <Link key={s.href} href={s.href} target={s.external ? '_blank' : undefined}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <span>{s.icon}</span>
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, valueColor, href }: {
  label: string; value: string; valueColor?: string; href: string
}) {
  return (
    <Link href={href} className="rounded-xl border bg-white p-4 hover:bg-gray-50 transition-colors block">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor ?? 'text-gray-900'}`}>{value}</p>
    </Link>
  )
}
