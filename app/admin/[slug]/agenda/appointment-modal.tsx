'use client'

import { useState } from 'react'
import Modal from '@/components/ui/modal'
import Button from '@/components/ui/button'
import { updateAppointmentStatus } from '@/app/actions/appointments'
import { TIMEZONE } from '@/lib/availability'

type Appointment = {
  id: string
  starts_at: string
  ends_at: string
  status: string
  notes: string | null
  internal_notes: string | null
  price_snapshot: number
  services: { name: string } | null
  professionals: { name: string } | null
  clients: { full_name: string; phone: string | null } | null
}

const TRANSITIONS: Record<string, { label: string; next: import('@/types/database').AppointmentStatus; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  pending:     [{ label: 'Confirmar', next: 'confirmed', variant: 'primary' }, { label: 'Cancelar', next: 'cancelled', variant: 'danger' }],
  confirmed:   [{ label: 'Iniciar atendimento', next: 'in_progress', variant: 'primary' }, { label: 'Cancelar', next: 'cancelled', variant: 'danger' }, { label: 'Não compareceu', next: 'no_show', variant: 'secondary' }],
  in_progress: [{ label: 'Concluir', next: 'completed', variant: 'primary' }, { label: 'Cancelar', next: 'cancelled', variant: 'danger' }],
  completed:   [],
  cancelled:   [],
  no_show:     [],
}

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

export default function AppointmentModal({
  appointment,
  open,
  onClose,
  onUpdated,
}: {
  appointment: Appointment | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!appointment) return null

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const start = new Date(appointment.starts_at)
  const end = new Date(appointment.ends_at)
  const timeRange = `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} – ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })}`

  async function handleTransition(nextStatus: import('@/types/database').AppointmentStatus) {
    setLoading(nextStatus)
    setError(null)
    const result = await updateAppointmentStatus(appointment!.id, nextStatus)
    if (!result.success) { setError(result.error ?? 'Erro.'); setLoading(null); return }
    setLoading(null)
    onUpdated()
    onClose()
  }

  const transitions = TRANSITIONS[appointment.status] ?? []
  const st = STATUS_STYLES[appointment.status]

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do agendamento">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--agendou-text)' }}>{appointment.services?.name}</p>
            <p className="text-sm" style={{ color: 'var(--agendou-text-muted)' }}>{appointment.professionals?.name} · {timeRange}</p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: st?.bg ?? 'rgba(255,255,255,0.08)', color: st?.color ?? 'var(--agendou-text-muted)' }}
          >
            {STATUS_LABELS[appointment.status]}
          </span>
        </div>

        <dl
          className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl p-3 text-sm"
          style={{ backgroundColor: 'var(--agendou-surface-2)' }}
        >
          <dt style={{ color: 'var(--agendou-text-muted)' }}>Cliente</dt>
          <dd className="font-medium" style={{ color: 'var(--agendou-text)' }}>{appointment.clients?.full_name}</dd>
          {appointment.clients?.phone && <>
            <dt style={{ color: 'var(--agendou-text-muted)' }}>Telefone</dt>
            <dd>
              <a href={`tel:${appointment.clients.phone}`} className="underline" style={{ color: '#C4B5FD' }}>
                {appointment.clients.phone}
              </a>
            </dd>
          </>}
          <dt style={{ color: 'var(--agendou-text-muted)' }}>Valor</dt>
          <dd className="font-semibold" style={{ color: '#4ADE80' }}>{fmt.format(appointment.price_snapshot)}</dd>
        </dl>

        {appointment.notes && (
          <div className="rounded-xl pl-3 py-2 pr-3" style={{ borderLeft: '2px solid var(--agendou-border)', backgroundColor: 'var(--agendou-surface-2)' }}>
            <p className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>Observações do cliente</p>
            <p className="text-sm" style={{ color: 'var(--agendou-text)' }}>{appointment.notes}</p>
          </div>
        )}
        {appointment.internal_notes && (
          <div className="rounded-xl pl-3 py-2 pr-3" style={{ borderLeft: '2px solid #D97706', backgroundColor: 'rgba(234,179,8,0.08)' }}>
            <p className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>Notas internas</p>
            <p className="text-sm" style={{ color: 'var(--agendou-text)' }}>{appointment.internal_notes}</p>
          </div>
        )}

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        {transitions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid var(--agendou-border)' }}>
            {transitions.map((t) => (
              <Button
                key={t.next}
                variant={t.variant}
                loading={loading === t.next}
                disabled={!!loading}
                onClick={() => handleTransition(t.next)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
