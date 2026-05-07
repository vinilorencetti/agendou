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

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do agendamento">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{appointment.services?.name}</p>
            <p className="text-sm text-gray-500">{appointment.professionals?.name} · {timeRange}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusColor(appointment.status)}`}>
            {STATUS_LABELS[appointment.status]}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-gray-50 p-3 text-sm">
          <dt className="text-gray-500">Cliente</dt>
          <dd className="font-medium">{appointment.clients?.full_name}</dd>
          {appointment.clients?.phone && <>
            <dt className="text-gray-500">Telefone</dt>
            <dd><a href={`tel:${appointment.clients.phone}`} className="underline">{appointment.clients.phone}</a></dd>
          </>}
          <dt className="text-gray-500">Valor</dt>
          <dd className="font-medium">{fmt.format(appointment.price_snapshot)}</dd>
        </dl>

        {appointment.notes && (
          <div className="rounded-lg border-l-2 border-gray-300 pl-3">
            <p className="text-xs text-gray-400">Observações do cliente</p>
            <p className="text-sm">{appointment.notes}</p>
          </div>
        )}
        {appointment.internal_notes && (
          <div className="rounded-lg border-l-2 border-amber-300 pl-3">
            <p className="text-xs text-gray-400">Notas internas</p>
            <p className="text-sm">{appointment.internal_notes}</p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {transitions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t pt-3">
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

function statusColor(s: string) {
  const map: Record<string, string> = {
    confirmed: 'text-blue-700 bg-blue-50', pending: 'text-amber-700 bg-amber-50',
    in_progress: 'text-green-700 bg-green-50', completed: 'text-gray-600 bg-gray-100',
    cancelled: 'text-red-600 bg-red-50', no_show: 'text-purple-700 bg-purple-50',
  }
  return map[s] ?? 'text-gray-600 bg-gray-100'
}
