import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Master Admin — Agendou' }

export default async function MasterAdminPage() {
  const supabase = await createClient()

  const [
    { count: totalTenants },
    { count: activeTenants },
    { count: totalAppointments },
    { data: revenueData },
    { data: recentTenants },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('financial_entries')
      .select('amount')
      .eq('type', 'income')
      .eq('status', 'paid'),
    supabase.from('tenants')
      .select('id, name, slug, status, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalRevenue = (revenueData ?? []).reduce((s, e) => s + e.amount, 0)
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo',
    })
  }

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-900/50 text-green-400',
    suspended: 'bg-yellow-900/50 text-yellow-400',
    cancelled: 'bg-red-900/50 text-red-400',
  }
  const STATUS_LABELS: Record<string, string> = {
    active: 'Ativo', suspended: 'Suspenso', cancelled: 'Cancelado',
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="mt-1 text-sm text-gray-400">Métricas globais da plataforma Agendou.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Tenants totais', value: String(totalTenants ?? 0) },
          { label: 'Tenants ativos', value: String(activeTenants ?? 0), color: 'text-green-400' },
          { label: 'Agendamentos', value: String(totalAppointments ?? 0), color: 'text-blue-400' },
          { label: 'Receita total (paga)', value: fmt.format(totalRevenue), color: 'text-emerald-400' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color ?? 'text-white'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tenants recentes */}
      <div className="rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold">Tenants recentes</h2>
          <Link href="/master-admin/tenants" className="text-xs text-gray-400 hover:text-white">
            Ver todos →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-gray-500">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium">Plano</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(recentTenants ?? []).map((t) => (
              <tr key={t.id} className="hover:bg-white/5">
                <td className="px-5 py-3 font-medium">
                  <Link href={`/master-admin/tenants/${t.id}`} className="hover:underline">{t.name}</Link>
                </td>
                <td className="px-5 py-3 text-gray-400">{t.slug}</td>
                <td className="px-5 py-3 text-gray-400 capitalize">{t.plan}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[t.status] ?? ''}`}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400">{fmtDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
