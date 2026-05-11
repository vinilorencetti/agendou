import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'

export const metadata: Metadata = { title: 'Histórico do cliente' }

type Props = { params: Promise<{ slug: string; clientId: string }> }

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendente', in_progress: 'Em atendimento',
  completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu',
}
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  confirmed:   { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  pending:     { bg: 'rgba(234,179,8,0.15)',   color: '#FACC15' },
  in_progress: { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80' },
  completed:   { bg: 'rgba(255,255,255,0.08)', color: '#9CA3AF' },
  cancelled:   { bg: 'rgba(239,68,68,0.15)',   color: '#F87171' },
  no_show:     { bg: 'rgba(167,139,250,0.15)', color: '#C4B5FD' },
}

const TZ = 'America/Sao_Paulo'

export default async function ClienteDetailPage({ params }: Props) {
  const { slug, clientId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar`)

  const tenant = await getTenantBySlug(slug)
  if (!tenant) redirect(`/admin/${slug}`)

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('tenant_id', tenant.id)
    .single()

  if (!client) notFound()

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, starts_at, ends_at, status, price_snapshot, notes, services(name), professionals(name)')
    .eq('client_id', clientId)
    .eq('tenant_id', tenant.id)
    .order('starts_at', { ascending: false })

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const completed = (appointments ?? []).filter((a) => a.status === 'completed')
  const totalSpent = completed.reduce((s, a) => s + a.price_snapshot, 0)
  const lastVisit = completed[0]?.starts_at

  function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: TZ,
    })
  }

  const cardStyle = {
    backgroundColor: 'var(--agendou-surface)',
    border: '1px solid var(--agendou-border)',
  }

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/${slug}/clientes`}
        className="mb-4 flex items-center gap-1 text-sm transition-colors"
        style={{ color: 'var(--agendou-text-faint)' }}
      >
        ← Voltar para clientes
      </Link>

      {/* Cabeçalho */}
      <div className="mb-6 rounded-2xl p-5" style={cardStyle}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--agendou-text)' }}>{client.full_name}</h1>
            <div className="mt-2 flex flex-col gap-1 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
              {client.phone && <p>📱 {client.phone}</p>}
              {client.email && <p>✉️ {client.email}</p>}
            </div>
            {client.notes && (
              <p
                className="mt-3 rounded-xl px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text-muted)' }}
              >
                {client.notes}
              </p>
            )}
          </div>

          {/* Estatísticas */}
          <div className="flex shrink-0 gap-4 text-right text-sm">
            <div>
              <p className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>Visitas</p>
              <p className="text-xl font-bold" style={{ color: 'var(--agendou-text)' }}>{completed.length}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>Total gasto</p>
              <p className="text-xl font-bold" style={{ color: '#4ADE80' }}>{fmt.format(totalSpent)}</p>
            </div>
          </div>
        </div>

        {lastVisit && (
          <p className="mt-3 text-xs" style={{ color: 'var(--agendou-text-faint)' }}>
            Última visita: {fmtDateTime(lastVisit)}
          </p>
        )}
      </div>

      {/* Histórico */}
      <h2 className="mb-3 font-semibold" style={{ color: 'var(--agendou-text)' }}>Histórico de agendamentos</h2>

      {!appointments || appointments.length === 0 ? (
        <p className="rounded-2xl py-12 text-center text-sm" style={{ ...cardStyle, color: 'var(--agendou-text-faint)' }}>
          Nenhum agendamento registrado.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {appointments.map((appt) => {
            const st = STATUS_STYLES[appt.status]
            return (
              <div key={appt.id} className="rounded-2xl p-4" style={cardStyle}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium" style={{ color: 'var(--agendou-text)' }}>{(appt.services as any)?.name}</p>
                    <p className="text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
                      {fmtDateTime(appt.starts_at)} · {(appt.professionals as any)?.name}
                    </p>
                    {appt.notes && (
                      <p className="mt-1.5 text-xs italic" style={{ color: 'var(--agendou-text-faint)' }}>"{appt.notes}"</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: st?.bg ?? 'rgba(255,255,255,0.08)', color: st?.color ?? 'var(--agendou-text-muted)' }}
                    >
                      {STATUS_LABELS[appt.status]}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--agendou-text)' }}>
                      {fmt.format(appt.price_snapshot)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
