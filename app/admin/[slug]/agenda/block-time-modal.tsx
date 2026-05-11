'use client'

import { useState } from 'react'
import Modal from '@/components/ui/modal'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { createBlockedTime } from '@/app/actions/appointments'

type Professional = { id: string; name: string }

export default function BlockTimeModal({
  open,
  onClose,
  onCreated,
  professionals,
  defaultProfessionalId,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  professionals: Professional[]
  defaultProfessionalId?: string
  defaultDate: string
}) {
  const [form, setForm] = useState({
    professionalId: defaultProfessionalId ?? professionals[0]?.id ?? '',
    date: defaultDate,
    startTime: '12:00',
    endTime: '13:00',
    reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const toUtc = (time: string) => {
      const [year, month, day] = form.date.split('-').map(Number)
      const [hour, minute] = time.split(':').map(Number)
      return new Date(Date.UTC(year, month - 1, day, hour, minute) + 3 * 60 * 60 * 1000).toISOString()
    }

    if (form.startTime >= form.endTime) {
      setError('O horário de término deve ser após o início.')
      setLoading(false)
      return
    }

    const result = await createBlockedTime({
      professionalId: form.professionalId,
      startAt: toUtc(form.startTime),
      endAt: toUtc(form.endTime),
      reason: form.reason || undefined,
    })

    if (!result.success) { setError(result.error ?? 'Erro.'); setLoading(false); return }
    setLoading(false)
    onCreated()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Bloquear horário">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>Profissional</label>
          <select value={form.professionalId} onChange={set('professionalId')}
            className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            style={{ backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text)', border: '1px solid var(--agendou-border)' }}>
            {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <Input id="bt-date" label="Data" type="date" value={form.date} onChange={set('date')} required />

        <div className="grid grid-cols-2 gap-3">
          <Input id="bt-start" label="Início" type="time" value={form.startTime} onChange={set('startTime')} required />
          <Input id="bt-end" label="Término" type="time" value={form.endTime} onChange={set('endTime')} required />
        </div>

        <Input id="bt-reason" label="Motivo" placeholder="Ex: Almoço, compromisso pessoal..." value={form.reason} onChange={set('reason')} />

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading} variant="danger">Bloquear</Button>
        </div>
      </form>
    </Modal>
  )
}
