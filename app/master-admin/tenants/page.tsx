import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Tenants — Master Admin' }

type Props = { searchParams: Promise<{ q?: string; status?: string }> }

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/50 text-green-400',
  suspended: 'bg-yellow-900/50 text-yellow-400',
  cancelled: 'bg-red-900/50 text-red-400',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo', suspended: 'Suspenso', cancelled: 'Cancelado',
}

export default async function TenantsPage({ searchParams }: Props) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('tenants')
    .select('id, name, slug, status, plan, phone, created_at')
    .order('created_at', { ascending: false })

  if (q?.trim()) {
    query = query.or(`name.ilike.%${q.trim()}%,slug.ilike.%${q.trim()}%`)
  }
  if (status && status !== 'all') {
    query = query.eq('status', status as 'active' | 'suspended' | 'cancelled')
  }

  const { data: tenants } = await query

  // Contagem de profissionais e agendamentos por tenant
  const ids = (tenants ?? []).map((t) => t.id)

  const [{ data: proCounts }, { data: apptCounts }] = await Promise.all([
    ids.length > 0
      ? supabase.from('professionals').select('tenant_id').in('tenant_id', ids).eq('is_active', true)
      : { data: [] },
    ids.length > 0
      ? supabase.from('appointments').select('tenant_id').in('tenant_id', ids)
      : { data: [] },
  ])

  const proMap: Record<string, number> = {}
  const apptMap: Record<string, number> = {}
  for (const p of proCounts ?? []) proMap[p.tenant_id] = (proMap[p.tenant_id] ?? 0) + 1
  for (const a of apptCounts ?? []) apptMap[a.tenant_id] = (apptMap[a.tenant_id] ?? 0) + 1

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo',
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Tenants</h1>
        <p className="mt-1 text-sm text-agendou-muted">{tenants?.length ?? 0} negócio{tenants?.length !== 1 ? 's' : ''} encontrado{tenants?.length !== 1 ? 's' : ''}.</p>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q ?? ''}
          placeholder="Buscar por nome ou slug..."
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-white/30"
        />
        <select name="status" defaultValue={status ?? 'all'}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/30">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="suspended">Suspensos</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <button type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--agendou-gradient)' }}>
          Filtrar
        </button>
      </form>

      {/* Tabela */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        {!tenants || tenants.length === 0 ? (
          <p className="py-16 text-center text-sm text-agendou-muted">Nenhum tenant encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-agendou-faint">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Plano</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-center">Profis.</th>
                  <th className="px-5 py-3 font-medium text-center">Agend.</th>
                  <th className="px-5 py-3 font-medium">Criado em</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5">
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/master-admin/tenants/${t.id}`} className="hover:underline">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-agendou-muted">{t.slug}</td>
                    <td className="px-5 py-3 capitalize text-agendou-muted">{t.plan}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[t.status] ?? ''}`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-agendou-muted">{proMap[t.id] ?? 0}</td>
                    <td className="px-5 py-3 text-center text-agendou-muted">{apptMap[t.id] ?? 0}</td>
                    <td className="px-5 py-3 text-agendou-muted">{fmtDate(t.created_at)}</td>
                    <td className="px-5 py-3">
                      <Link href={`/master-admin/tenants/${t.id}`}
                        className="text-xs text-agendou-muted hover:text-white hover:underline">
                        Detalhes →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
