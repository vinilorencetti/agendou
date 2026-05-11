'use client'

import { useState } from 'react'
import Modal from '@/components/ui/modal'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { createManualEntry } from '@/app/actions/financial'

type Professional = { id: string; name: string }

const CATEGORIES = {
  income: ['Serviço', 'Produto', 'Gorjeta', 'Outro'],
  expense: ['Aluguel', 'Produto', 'Salário', 'Marketing', 'Equipamento', 'Utilidades', 'Outro'],
}

export default function NewEntryModal({
  open,
  onClose,
  onCreated,
  tenantId,
  professionals,
  today,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  tenantId: string
  professionals: Professional[]
  today: string
}) {
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: '',
    dueDate: today,
    category: '',
    notes: '',
    professionalId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      setError('Informe um valor válido.')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createManualEntry({
      tenantId,
      type: form.type,
      description: form.description,
      amount,
      dueDate: form.dueDate,
      category: form.category || undefined,
      notes: form.notes || undefined,
      professionalId: form.professionalId || undefined,
    })

    if (!result.success) { setError(result.error ?? 'Erro.'); setLoading(false); return }

    setLoading(false)
    onCreated()
    onClose()
    setForm({ type: 'expense', description: '', amount: '', dueDate: today, category: '', notes: '', professionalId: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo lançamento">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Tipo */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--agendou-border)' }}>
          {(['expense', 'income'] as const).map((t) => (
            <button key={t} type="button"
              onClick={() => setForm((f) => ({ ...f, type: t, category: '' }))}
              className="flex-1 py-2 text-sm font-medium transition-all"
              style={form.type === t
                ? { background: 'var(--agendou-gradient)', color: '#fff' }
                : { backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text-faint)' }
              }>
              {t === 'income' ? '↑ Receita' : '↓ Despesa'}
            </button>
          ))}
        </div>

        <Input id="fe-desc" label="Descrição" required value={form.description} onChange={set('description')}
          placeholder={form.type === 'income' ? 'Ex: Corte de cabelo' : 'Ex: Aluguel do espaço'} />

        <div className="grid grid-cols-2 gap-3">
          <Input id="fe-amount" label="Valor (R$)" required value={form.amount} onChange={set('amount')}
            placeholder="0,00" inputMode="decimal" />
          <Input id="fe-date" label="Data" type="date" required value={form.dueDate} onChange={set('dueDate')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>Categoria</label>
          <select value={form.category} onChange={set('category')}
            className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            style={{ backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text)', border: '1px solid var(--agendou-border)' }}>
            <option value="">Sem categoria</option>
            {CATEGORIES[form.type].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {professionals.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              Profissional <span className="font-normal opacity-50">(opcional)</span>
            </label>
            <select value={form.professionalId} onChange={set('professionalId')}
              className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{ backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text)', border: '1px solid var(--agendou-border)' }}>
              <option value="">Nenhum</option>
              {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="fe-notes" className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
            Observações <span className="font-normal opacity-50">(opcional)</span>
          </label>
          <textarea id="fe-notes" rows={2} value={form.notes} onChange={set('notes')}
            className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
            style={{ backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text)', border: '1px solid var(--agendou-border)' }} />
        </div>

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Salvar lançamento</Button>
        </div>
      </form>
    </Modal>
  )
}
