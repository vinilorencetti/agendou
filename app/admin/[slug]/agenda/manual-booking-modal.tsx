'use client'

import { useState } from 'react'
import Modal from '@/components/ui/modal'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { createManualBooking } from '@/app/actions/appointments'
import { TIMEZONE } from '@/lib/availability'

type Professional = { id: string; name: string }
type Service = { id: string; name: string; duration_min: number; price: number }

export default function ManualBookingModal({
  open,
  onClose,
  onCreated,
  tenantId,
  professionals,
  services,
  defaultDate,
  defaultProfessionalId,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  tenantId: string
  professionals: Professional[]
  services: Service[]
  defaultDate: string
  defaultProfessionalId?: string
}) {
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    professionalId: defaultProfessionalId ?? professionals[0]?.id ?? '',
    serviceId: services[0]?.id ?? '',
    date: defaultDate,
    startTime: '09:00',
    internalNotes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  const selectedService = services.find((s) => s.id === form.serviceId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService) return
    setLoading(true)
    setError(null)

    // Monta UTC a partir da data/hora local de Brasília (UTC-3)
    const [year, month, day] = form.date.split('-').map(Number)
    const [hour, minute] = form.startTime.split(':').map(Number)
    const startUtc = new Date(Date.UTC(year, month - 1, day, hour, minute) + 3 * 60 * 60 * 1000).toISOString()
    const endUtc   = new Date(new Date(startUtc).getTime() + selectedService.duration_min * 60_000).toISOString()

    const result = await createManualBooking({
      tenantId,
      professionalId: form.professionalId,
      serviceId: form.serviceId,
      startUtc,
      endUtc,
      clientName: form.clientName,
      clientPhone: form.clientPhone || undefined,
      internalNotes: form.internalNotes || undefined,
    })

    if (!result.success) { setError(result.error ?? 'Erro.'); setLoading(false); return }
    setLoading(false)
    onCreated()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Profissional</label>
            <select value={form.professionalId} onChange={set('professionalId')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black">
              {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Serviço</label>
            <select value={form.serviceId} onChange={set('serviceId')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black">
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.duration_min}min)</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input id="mb-date" label="Data" type="date" value={form.date} onChange={set('date')} required />
          <Input id="mb-time" label="Horário" type="time" value={form.startTime} onChange={set('startTime')} required />
        </div>

        <Input id="mb-client" label="Nome do cliente" required value={form.clientName} onChange={set('clientName')} placeholder="João Silva" />
        <Input id="mb-phone" label="Telefone" type="tel" value={form.clientPhone} onChange={set('clientPhone')} placeholder="(11) 99999-9999" />

        {selectedService && (
          <p className="text-xs text-gray-500">
            Término previsto: {form.startTime} + {selectedService.duration_min} min · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Notas internas <span className="font-normal text-gray-400">(opcional)</span></label>
          <textarea value={form.internalNotes} onChange={set('internalNotes')} rows={2}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Agendar</Button>
        </div>
      </form>
    </Modal>
  )
}
