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

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, starts_at, ends_at, status, notes, price_snapshot,
      services(name, duration_min),
      professionals(name, avatar_url)
    `)
    .eq('tenant_id', tenant.id)
    .in('clients.user_id', [user.id])
    // Join via clients
    .order('starts_at', { ascending: false })

  // Query alternativa — busca via clients
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
  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'text-blue-600 bg-blue-50', pending: 'text-amber-600 bg-amber-50',
    in_progress: 'text-green-600 bg-green-50', completed: 'text-gray-500 bg-gray-100',
    cancelled: 'text-red-500 bg-red-50', no_show: 'text-purple-600 bg-purple-50',
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 py-8">
      <div className="mb-6 flex items-center gap-3">
        <a href={`/${slug}`} className="text-sm opacity-50 hover:opacity-100">←</a>
        <h1 className="text-xl font-bold">Meus agendamentos</h1>
      </div>

      {!myAppointments || myAppointments.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg opacity-40">Nenhum agendamento encontrado.</p>
          <a
            href={`/${slug}/agendar`}
            className="mt-4 inline-block rounded-xl px-6 py-3 text-sm font-bold"
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

            return (
              <li key={appt.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{service?.name}</p>
                    <p className="mt-0.5 text-sm opacity-60">
                      {dateLabel} às {timeLabel} · {pro?.name}
                    </p>
                    <p className="mt-1 text-sm font-bold">{fmt.format(appt.price_snapshot)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[appt.status] ?? ''}`}
                  >
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </span>
                </div>

                {appt.notes && (
                  <p className="mt-2 text-xs opacity-50">{appt.notes}</p>
                )}

                {isUpcoming && (
                  <div className="mt-3 border-t pt-3">
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
