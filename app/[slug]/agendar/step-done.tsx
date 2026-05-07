import { formatDateLabel, TIMEZONE } from '@/lib/availability'
import type { ConfirmedBooking } from './booking-flow'

export default function StepDone({
  booking,
  tenantSlug,
}: {
  booking: ConfirmedBooking
  tenantSlug: string
  appointmentId: string
}) {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const startDate = new Date(booking.slot.startUtc)
  const timeLabel = startDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
  })

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
        style={{ backgroundColor: `var(--color-brand)`, color: 'var(--color-brand-foreground)' }}
      >
        ✓
      </div>

      <h2 className="text-2xl font-bold">Agendado!</h2>
      <p className="mt-2 opacity-60">Seu horário está confirmado.</p>

      <div
        className="mt-6 w-full rounded-2xl p-5 text-left"
        style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
      >
        <dl className="flex flex-col gap-3 text-sm">
          <Row label="Serviço" value={booking.service.name} />
          <Row label="Profissional" value={booking.professional.name} />
          <Row label="Data" value={`${formatDateLabel(booking.date)} às ${timeLabel}`} />
          <Row label="Duração" value={`${booking.service.duration_min} min`} />
          <Row label="Valor" value={fmt.format(booking.service.price)} />
        </dl>
      </div>

      <a
        href={`/${tenantSlug}/meus-agendamentos`}
        className="mt-8 w-full rounded-xl py-4 text-sm font-bold text-center block"
        style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
      >
        Ver meus agendamentos
      </a>

      <a
        href={`/${tenantSlug}`}
        className="mt-3 text-sm opacity-50 hover:opacity-80"
      >
        Voltar para a página inicial
      </a>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="opacity-50">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  )
}
