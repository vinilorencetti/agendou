import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'

export const metadata: Metadata = { title: 'Clientes' }

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function ClientesPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { q } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?redirect=/admin/${slug}/clientes`)

  const tenant = await getTenantBySlug(slug)
  if (!tenant) redirect(`/admin/${slug}`)

  let query = supabase
    .from('clients')
    .select('id, full_name, phone, email, created_at')
    .eq('tenant_id', tenant.id)
    .order('full_name')

  if (q?.trim()) {
    query = query.or(`full_name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`)
  }

  const { data: clients } = await query.limit(100)

  const clientIds = (clients ?? []).map((c) => c.id)
  const { data: apptCounts } = clientIds.length > 0
    ? await supabase
        .from('appointments')
        .select('client_id')
        .in('client_id', clientIds)
        .not('status', 'in', '("cancelled","no_show")')
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const a of apptCounts ?? []) {
    countMap[a.client_id] = (countMap[a.client_id] ?? 0) + 1
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo',
    })
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--agendou-text)' }}>Clientes</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
        {clients?.length ?? 0} cliente{clients?.length !== 1 ? 's' : ''} cadastrado{clients?.length !== 1 ? 's' : ''}.
      </p>

      {/* Busca */}
      <form method="GET" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar por nome, telefone ou e-mail..."
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
          style={{
            backgroundColor: 'var(--agendou-surface)',
            color: 'var(--agendou-text)',
            border: '1px solid var(--agendou-border)',
          }}
        />
        <button
          type="submit"
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: 'var(--agendou-gradient)' }}
        >
          Buscar
        </button>
        {q && (
          <Link
            href={`/admin/${slug}/clientes`}
            className="rounded-xl px-4 py-2.5 text-sm transition-colors"
            style={{ color: 'var(--agendou-text-muted)', backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
          >
            Limpar
          </Link>
        )}
      </form>

      {/* Lista */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}>
        {!clients || clients.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
            {q ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs" style={{ borderBottom: '1px solid var(--agendou-border)', backgroundColor: 'var(--agendou-surface-2)' }}>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>Nome</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>Telefone</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>E-mail</th>
                <th className="px-4 py-3 font-semibold text-center" style={{ color: 'var(--agendou-text-muted)' }}>Agendamentos</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr
                  key={client.id}
                  style={i > 0 ? { borderTop: '1px solid var(--agendou-border)' } : {}}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--agendou-text)' }}>{client.full_name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--agendou-text-muted)' }}>{client.phone ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--agendou-text-muted)' }}>{client.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={countMap[client.id]
                        ? { backgroundColor: 'rgba(124,58,237,0.2)', color: '#C4B5FD' }
                        : { color: 'var(--agendou-text-faint)' }
                      }
                    >
                      {countMap[client.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--agendou-text-faint)' }}>{fmtDate(client.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${slug}/clientes/${client.id}`}
                      className="text-xs font-medium transition-colors"
                      style={{ color: 'var(--agendou-text-muted)' }}
                    >
                      Ver histórico →
                    </Link>
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
