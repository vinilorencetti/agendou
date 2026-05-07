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

  // Conta agendamentos por cliente
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
      <h1 className="mb-1 text-xl font-semibold">Clientes</h1>
      <p className="mb-6 text-sm text-gray-500">
        {clients?.length ?? 0} cliente{clients?.length !== 1 ? 's' : ''} cadastrado{clients?.length !== 1 ? 's' : ''}.
      </p>

      {/* Busca */}
      <form method="GET" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar por nome, telefone ou e-mail..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
        />
        <button type="submit"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Buscar
        </button>
        {q && (
          <Link href={`/admin/${slug}/clientes`}
            className="rounded-lg border px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">
            Limpar
          </Link>
        )}
      </form>

      {/* Lista */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {!clients || clients.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            {q ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium text-center">Agendamentos</th>
                <th className="px-4 py-3 font-medium">Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{client.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{client.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{client.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      countMap[client.id] ? 'bg-blue-50 text-blue-700' : 'text-gray-400'
                    }`}>
                      {countMap[client.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(client.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/${slug}/clientes/${client.id}`}
                      className="text-xs font-medium text-gray-500 hover:text-black hover:underline">
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
