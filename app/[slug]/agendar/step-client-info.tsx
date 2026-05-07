'use client'

import { useState } from 'react'
import { createBooking } from '@/app/actions/appointments'
import { formatDateLabel, TIMEZONE } from '@/lib/availability'
import type { ConfirmedBooking } from './booking-flow'

export default function StepClientInfo({
  tenantId,
  booking,
  onConfirmed,
  onBack,
}: {
  tenantId: string
  booking: ConfirmedBooking
  onConfirmed: (appointmentId: string) => void
  onBack: () => void
}) {
  const [fields, setFields] = useState({ name: '', phone: '', email: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))
  }

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const startDate = new Date(booking.slot.startUtc)
  const timeLabel = startDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
  })
  const dateLabel = formatDateLabel(booking.date)

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!fields.name.trim()) return
    setLoading(true)
    setError(null)

    const result = await createBooking({
      tenantId,
      professionalId: booking.professional.id,
      serviceId: booking.service.id,
      startUtc: booking.slot.startUtc,
      endUtc: booking.slot.endUtc,
      clientName: fields.name,
      clientPhone: fields.phone || undefined,
      clientEmail: fields.email || undefined,
      notes: fields.notes || undefined,
    })

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    onConfirmed(result.appointmentId)
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm opacity-50 hover:opacity-100">←</button>
        <h2 className="text-lg font-semibold">Confirme seus dados</h2>
      </div>

      {/* Resumo do agendamento */}
      <div
        className="mb-6 rounded-xl p-4"
        style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--color-brand') || '#000'}11` }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--color-brand)' }}>
          {booking.service.name}
        </p>
        <p className="mt-1 text-sm opacity-70">
          {dateLabel} às {timeLabel} · {booking.professional.name}
        </p>
        <p className="mt-1 text-sm font-bold">{fmt.format(booking.service.price)}</p>
      </div>

      <form onSubmit={handleConfirm} className="flex flex-col gap-4">
        <div>
          <label htmlFor="ci-name" className="mb-1 block text-sm font-medium">
            Seu nome <span className="text-red-400">*</span>
          </label>
          <input
            id="ci-name"
            type="text"
            required
            autoComplete="name"
            value={fields.name}
            onChange={set('name')}
            placeholder="Como você quer ser chamado"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
          />
        </div>

        <div>
          <label htmlFor="ci-phone" className="mb-1 block text-sm font-medium">
            WhatsApp / Celular
          </label>
          <input
            id="ci-phone"
            type="tel"
            autoComplete="tel"
            value={fields.phone}
            onChange={set('phone')}
            placeholder="(11) 99999-9999"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
          />
        </div>

        <div>
          <label htmlFor="ci-email" className="mb-1 block text-sm font-medium">
            E-mail
          </label>
          <input
            id="ci-email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={set('email')}
            placeholder="para@receber.confirmação"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
          />
        </div>

        <div>
          <label htmlFor="ci-notes" className="mb-1 block text-sm font-medium">
            Observações <span className="font-normal opacity-50">(opcional)</span>
          </label>
          <textarea
            id="ci-notes"
            value={fields.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Ex: prefiro o lado direito, cabelo comprido na frente..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !fields.name.trim()}
          className="mt-2 w-full rounded-xl py-4 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Confirmando...
            </span>
          ) : (
            'Confirmar agendamento'
          )}
        </button>
      </form>
    </div>
  )
}
