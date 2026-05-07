import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TenantStatusButton from './tenant-status-button'

export const metadata: Metadata = { title: 'Detalhe do Tenant — Master Admin' }

type Props = { params: Promise<{ tenantId: string }> }

const TZ = 'America/Sao_Paulo'

export default async function TenantDetailPage({ params }: Props) {
  const { tenantId } = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (!tenant) notFound()

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: TZ })
  const currentMonth = today.slice(0, 7)
  const [year, mon] = currentMonth.split('-').map(Number)
  const firstOfMonth = `${currentMonth}-01`
  const lastOfMonth = new Date(year, mon, 0).toISOString().split('T')[0]

  const [
    { count: totalAppts },
    { count: monthAppts },
    { count: totalClients },
    { count: totalPros },
    { data: monthRevenue },
    { data: allRevenue },
    { data: professionals },
    { data: recentAppts },
  ] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('starts_at', `${firstOfMonth}T00:00:00Z`)
      .lte('starts_at', `${lastOfMonth}T23:59:59Z`),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('professionals').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('is_active', true),
    supabase.from('financial_entries').select('amount')
      .eq('tenant_id', tenantId).eq('type', 'income').eq('status', 'paid')
      .gte('due_date', firstOfMonth).lte('due_date', lastOfMonth),
    supabase.from('financial_entries').select('amount')
      .eq('tenant_id', tenantId).eq('type', 'income').eq('status', 'paid'),
    supabase.from('professionals').select('id, name, commission_pct, is_active').eq('tenant_id', tenantId).order('display_order'),
    supabase.from('appointments')
      .select('id, starts_at, status, services(name), clients(full_name)')
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: false })
      .limit(10),
  ])

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalRevenueMonth = (monthRevenue ?? []).reduce((s, e) => s + e.amount, 0)
  const totalRevenueAll = (allRevenue ?? []).reduce((s, e) => s + e.amount, 0)

  const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Confirmado', pending: 'Pendente', in_progress: 'Em atendimento',
    completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu',
  }
  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-blue-900/50 text-blue-400',
    pending: 'bg-yellow-900/50 text-yellow-400',
    in_progress: 'bg-green-900/50 text-green-400',
    completed: 'bg-white/10 text-gray-400',
    cancelled: 'bg-red-900/50 text-red-400',
    no_show: 'bg-purple-900/50 text-purple-400',
  }
  const TENANT_STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-900/50 text-green-400',
    suspended: 'bg-yellow-900/50 text-yellow-400',
    cancelled: 'bg-red-900/50 text-red-400',
  }
  const TENANT_STATUS_LABELS: Record<string, string> = {
    active: 'Ativo', suspended: 'Suspenso', cancelled: 'Cancelado',
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ,
    })
  }
  function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ,
    })
  }

  const monthLabel = new Date(year, mon - 1, 15).toLocaleDateString('pt-BR', { month: 'long', timeZone: TZ })

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Voltar */}
      <Link href="/master-admin/tenants" className="text-sm text-gray-400 hover:text-white">
        ← Voltar para tenants
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TENANT_STATUS_COLORS[tenant.status] ?? ''}`}>
              {TENANT_STATUS_LABELS[tenant.status] ?? tenant.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            agendou.com.br/{tenant.slug} · Plano {tenant.plan} · Desde {fmtDate(tenant.created_at)}
          </p>
          {tenant.phone && <p className="mt-0.5 text-sm text-gray-400">📱 {tenant.phone}</p>}
        </div>

        {/* Ações de status */}
        <TenantStatusButton tenantId={tenant.id} currentStatus={tenant.status} />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Agend. este mês', value: String(monthAppts ?? 0) },
          { label: 'Agend. total', value: String(totalAppts ?? 0), color: 'text-blue-400' },
          { label: `Receita — ${monthLabel}`, value: fmt.format(totalRevenueMonth), color: 'text-emerald-400' },
          { label: 'Receita total', value: fmt.format(totalRevenueAll), color: 'text-emerald-300' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`mt-1 text-xl font-bold ${c.color ?? 'text-white'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profissionais */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold">Profissionais ({totalPros ?? 0})</h2>
          </div>
          {!professionals || professionals.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400">Nenhum profissional.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {professionals.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className={p.is_active ? 'text-white' : 'text-gray-500 line-through'}>{p.name}</span>
                  <span className="text-gray-400">{p.commission_pct}% comissão</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Clientes */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold">Clientes ({totalClients ?? 0})</h2>
          </div>
          <div className="px-5 py-8 text-sm text-gray-400">
            {totalClients ?? 0} cliente{totalClients !== 1 ? 's' : ''} cadastrado{totalClients !== 1 ? 's' : ''} neste negócio.
          </div>
        </div>
      </div>

      {/* Agendamentos recentes */}
      <div className="rounded-xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold">Agendamentos recentes</h2>
        </div>
        {!recentAppts || recentAppts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400">Nenhum agendamento.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {recentAppts.map((a) => (
                <tr key={a.id} className="hover:bg-white/5">
                  <td className="px-5 py-3 text-gray-400">{fmtDateTime(a.starts_at)}</td>
                  <td className="px-5 py-3 font-medium">{(a.clients as any)?.full_name}</td>
                  <td className="px-5 py-3 text-gray-400">{(a.services as any)?.name}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[a.status] ?? ''}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
