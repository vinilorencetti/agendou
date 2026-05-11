import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { canClientCancel, cancelDeadlineLabel, TIMEZONE } from '@/lib/availability'
import CancelButton from './cancel-button'
import BottomNav from '@/components/ui/bottom-nav'

type Props = { params: Promise<{ slug: string }> }

export default async function MeusAgendamentosPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${slug}/entrar?redirect=/${slug}/meus-agendamentos`)

  const { data: clientRecord } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: myAppointments } = clientRecord
    ? await supabase
        .from('appointments')
        .select(`
          id, starts_at, ends_at, status, notes, price_snapshot,
          services(name, duration_min),
          professionals(name, avatar_url)
        `)
        .eq('tenant_id', tenant.id)
        .eq('client_id', clientRecord.id)
        .order('starts_at', { ascending: false })
    : { data: [] }

  const policyHours = tenant.cancellation_policy_hours
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Confirmado', pending: 'Pendente', in_progress: 'Em atendimento',
    completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu',
  }
  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    confirmed:   { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
    pending:     { bg: 'rgba(234,179,8,0.15)',   color: '#FACC15' },
    in_progress: { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80' },
    completed:   { bg: 'rgba(255,255,255,0.08)', color: 'var(--agendou-text-muted)' },
    cancelled:   { bg: 'rgba(239,68,68,0.15)',   color: '#F87171' },
    no_show:     { bg: 'rgba(167,139,250,0.15)', color: '#C4B5FD' },
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 py-8">
      <div className="mb-6 flex items-center gap-3">
        <a
          href={`/${slug}`}
          className="text-sm transition-opacity opacity-50 hover:opacity-100"
          style={{ color: 'var(--agendou-text)' }}
        >←</a>
        <h1 className="text-xl font-bold" style={{ color: 'var(--agendou-text)' }}>Meus agendamentos</h1>
      </div>

      {!myAppointments || myAppointments.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg" style={{ color: 'var(--agendou-text-faint)' }}>Nenhum agendamento encontrado.</p>
          <a
            href={`/${slug}/agendar`}
            className="mt-4 inline-block rounded-2xl px-6 py-3 text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
          >
            Fazer agendamento
          </a>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {myAppointments.map((appt) => {
            const service = appt.services as { name: string; duration_min: number } | null
            const pro = appt.professionals as { name: string; avatar_url: string | null } | null
            const startDate = new Date(appt.starts_at)
            const dateLabel = startDate.toLocaleDateString('pt-BR', {
              weekday: 'short', day: 'numeric', month: 'short', timeZone: TIMEZONE,
            })
            const timeLabel = startDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
            })
            const isUpcoming = ['confirmed', 'pending'].includes(appt.status)
            const allowCancel = isUpcoming && canClientCancel(appt.starts_at, policyHours)
            const deadline = isUpcoming ? cancelDeadlineLabel(appt.starts_at, policyHours) : null
            const st = STATUS_STYLES[appt.status]

            return (
              <li
                key={appt.id}
                className="rounded-2xl p-5 shadow-sm"
                style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--agendou-text)' }}>{service?.name}</p>
                    <p className="mt-0.5 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
                      {dateLabel} às {timeLabel} · {pro?.name}
                    </p>
                    <p className="mt-1 text-sm font-bold" style={{ color: 'var(--color-brand)' }}>
                      {fmt.format(appt.price_snapshot)}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: st?.bg ?? 'rgba(255,255,255,0.08)', color: st?.color ?? 'var(--agendou-text-muted)' }}
                  >
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </span>
                </div>

                {appt.notes && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--agendou-text-faint)' }}>{appt.notes}</p>
                )}

                {isUpcoming && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--agendou-border)' }}>
                    {allowCancel ? (
                      <CancelButton
                        appointmentId={appt.id}
                        policyHours={policyHours}
                        deadline={deadline!}
                      />
                    ) : (
                      <p className="text-xs text-red-400">
                        Prazo de cancelamento encerrado ({policyHours}h de antecedência necessárias).
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <BottomNav slug={slug} />
    </main>
  )
}
