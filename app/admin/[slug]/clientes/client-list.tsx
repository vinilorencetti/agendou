'use client'

import { useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/ui/modal'
import Button from '@/components/ui/button'
import { updateClient } from '@/app/actions/clients'

type Client = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

function clientCode(id: string) {
  return '#' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo',
  })
}

export default function ClientList({
  clients,
  countMap,
  slug,
  tenantId,
}: {
  clients: Client[]
  countMap: Record<string, number>
  slug: string
  tenantId: string
}) {
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openEdit(c: Client) {
    setForm({
      fullName: c.full_name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      notes: c.notes ?? '',
    })
    setError(null)
    setEditing(c)
  }

  function closeEdit() {
    setEditing(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setLoading(true)
    setError(null)

    const result = await updateClient(editing.id, tenantId, form, slug)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Erro desconhecido.')
      return
    }

    closeEdit()
    window.location.reload()
  }

  const inputStyle = {
    backgroundColor: 'var(--agendou-surface-2)',
    color: 'var(--agendou-text)',
    border: '1px solid var(--agendou-border)',
  }

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--agendou-border)'
      e.currentTarget.style.boxShadow = ''
    },
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}>
        {clients.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
            Nenhum cliente encontrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs" style={{ borderBottom: '1px solid var(--agendou-border)', backgroundColor: 'var(--agendou-surface-2)' }}>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>ID</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>Nome</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>Telefone</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>E-mail</th>
                <th className="px-4 py-3 font-semibold text-center" style={{ color: 'var(--agendou-text-muted)' }}>Agendamentos</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr
                  key={client.id}
                  style={i > 0 ? { borderTop: '1px solid var(--agendou-border)' } : {}}
                >
                  {/* ID curto */}
                  <td className="px-4 py-3">
                    <span
                      className="rounded-md px-1.5 py-0.5 font-mono text-xs"
                      style={{ backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text-faint)' }}
                    >
                      {clientCode(client.id)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--agendou-text)' }}>{client.full_name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--agendou-text-muted)' }}>{client.phone ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--agendou-text-muted)' }}>{client.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={countMap[client.id]
                        ? { backgroundColor: 'rgba(124,58,237,0.2)', color: '#C4B5FD' }
                        : { color: 'var(--agendou-text-faint)' }
                      }
                    >
                      {countMap[client.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--agendou-text-faint)' }}>{fmtDate(client.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(client)}
                        className="text-xs font-medium transition-colors"
                        style={{ color: 'var(--agendou-text-faint)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#A78BFA' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--agendou-text-faint)' }}
                      >
                        Editar
                      </button>
                      <Link
                        href={`/admin/${slug}/clientes/${client.id}`}
                        className="text-xs font-medium transition-colors"
                        style={{ color: 'var(--agendou-text-muted)' }}
                      >
                        Histórico →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de edição */}
      <Modal open={!!editing} onClose={closeEdit} title="Editar cliente">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>Nome *</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Nome completo"
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
              style={inputStyle}
              {...focusHandlers}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              Telefone <span className="font-normal opacity-50">(opcional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
              style={inputStyle}
              {...focusHandlers}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              E-mail <span className="font-normal opacity-50">(opcional)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="cliente@email.com"
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
              style={inputStyle}
              {...focusHandlers}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              Observações <span className="font-normal opacity-50">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Ex: Prefere corte com tesoura"
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none placeholder:opacity-40"
              style={inputStyle}
              {...focusHandlers}
            />
          </div>

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeEdit}>Cancelar</Button>
            <Button type="submit" loading={loading}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
