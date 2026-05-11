import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import ClientList from './client-list'

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
    .select('id, full_name, phone, email, notes, created_at')
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
      {!clients || clients.length === 0 ? (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}>
          <p className="py-16 text-center text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
            {q ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
        </div>
      ) : (
        <ClientList
          clients={clients}
          countMap={countMap}
          slug={slug}
          tenantId={tenant.id}
        />
      )}
    </div>
  )
}
