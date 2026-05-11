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
      {/* Ícone de sucesso */}
      <div
        className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg"
        style={{ background: 'var(--color-brand)', boxShadow: '0 0 40px rgba(var(--color-brand-rgb, 124,58,237),0.4)' }}
      >
        ✓
        {/* Anel pulsante */}
        <div
          className="absolute inset-0 animate-ping rounded-full opacity-20"
          style={{ backgroundColor: 'var(--color-brand)' }}
        />
      </div>

      <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--agendou-text)' }}>
        Agendado! 🎉
      </h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
        Seu horário está confirmado. Até lá!
      </p>

      {/* Resumo */}
      <div
        className="mt-6 w-full rounded-2xl p-5 text-left"
        style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--agendou-text-faint)' }}>
          Detalhes do agendamento
        </p>
        <dl className="flex flex-col gap-3 text-sm">
          <Row label="Serviço" value={booking.service.name} />
          <Row label="Profissional" value={booking.professional.name} />
          <Row label="Data e hora" value={`${formatDateLabel(booking.date)} às ${timeLabel}`} />
          <Row label="Duração" value={`${booking.service.duration_min} min`} />
          <Row
            label="Valor"
            value={fmt.format(booking.service.price)}
            valueColor="var(--color-brand)"
          />
        </dl>
      </div>

      <a
        href={`/${tenantSlug}/meus-agendamentos`}
        className="mt-6 block w-full rounded-xl py-4 text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
      >
        Ver meus agendamentos
      </a>

      <a
        href={`/${tenantSlug}`}
        className="mt-3 text-sm transition-opacity hover:opacity-80"
        style={{ color: 'var(--agendou-text-faint)' }}
      >
        ← Voltar para a página inicial
      </a>
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: 'var(--agendou-text-faint)' }}>{label}</dt>
      <dd className="text-right font-semibold" style={{ color: valueColor ?? 'var(--agendou-text)' }}>{value}</dd>
    </div>
  )
}
