'use client'

import { useState, useRef, useEffect } from 'react'
import Modal from '@/components/ui/modal'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { createManualBooking } from '@/app/actions/appointments'
import { TIMEZONE } from '@/lib/availability'

type Professional = { id: string; name: string }
type Service = { id: string; name: string; duration_min: number; price: number }
type ClientOption = { id: string; full_name: string; phone: string | null; email: string | null }

export default function ManualBookingModal({
  open,
  onClose,
  onCreated,
  tenantId,
  professionals,
  services,
  clients,
  defaultDate,
  defaultProfessionalId,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  tenantId: string
  professionals: Professional[]
  services: Service[]
  clients: ClientOption[]
  defaultDate: string
  defaultProfessionalId?: string
}) {
  const [form, setForm] = useState({
    professionalId: defaultProfessionalId ?? professionals[0]?.id ?? '',
    serviceId: services[0]?.id ?? '',
    date: defaultDate,
    startTime: '09:00',
    internalNotes: '',
  })

  // Client selection state
  const [clientMode, setClientMode] = useState<'search' | 'new'>('search')
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter clients based on search query
  const filteredClients = searchQuery.trim().length >= 1
    ? clients.filter((c) => {
        const q = searchQuery.toLowerCase()
        return (
          c.full_name.toLowerCase().includes(q) ||
          (c.phone ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          (c.email ?? '').toLowerCase().includes(q)
        )
      }).slice(0, 8)
    : []

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current && !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function selectClient(c: ClientOption) {
    setSelectedClient(c)
    setSearchQuery('')
    setShowDropdown(false)
  }

  function clearClient() {
    setSelectedClient(null)
    setSearchQuery('')
  }

  function switchToNew() {
    setClientMode('new')
    setSelectedClient(null)
    setSearchQuery('')
    setShowDropdown(false)
  }

  function switchToSearch() {
    setClientMode('search')
    setNewClientName('')
    setNewClientPhone('')
  }

  const selectedService = services.find((s) => s.id === form.serviceId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService) return

    // Validate client
    if (clientMode === 'search' && !selectedClient) {
      setError('Selecione um cliente ou cadastre um novo.')
      return
    }
    if (clientMode === 'new' && !newClientName.trim()) {
      setError('Informe o nome do cliente.')
      return
    }

    setLoading(true)
    setError(null)

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
      ...(clientMode === 'search' && selectedClient
        ? { clientId: selectedClient.id }
        : { clientName: newClientName, clientPhone: newClientPhone || undefined }
      ),
      internalNotes: form.internalNotes || undefined,
    })

    if (!result.success) { setError(result.error ?? 'Erro.'); setLoading(false); return }

    setLoading(false)
    onCreated()
    onClose()
  }

  const selectStyle = {
    backgroundColor: 'var(--agendou-surface-2)',
    color: 'var(--agendou-text)',
    border: '1px solid var(--agendou-border)',
  }

  const inputStyle = {
    backgroundColor: 'var(--agendou-surface-2)',
    color: 'var(--agendou-text)',
    border: '1px solid var(--agendou-border)',
  }

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = 'var(--agendou-border)'
      e.currentTarget.style.boxShadow = ''
    },
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Profissional + Serviço */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>Profissional</label>
            <select value={form.professionalId} onChange={set('professionalId')}
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={selectStyle}>
              {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>Serviço</label>
            <select value={form.serviceId} onChange={set('serviceId')}
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={selectStyle}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.duration_min}min)</option>)}
            </select>
          </div>
        </div>

        {/* Data + Horário */}
        <div className="grid grid-cols-2 gap-3">
          <Input id="mb-date" label="Data" type="date" value={form.date} onChange={set('date')} required />
          <Input id="mb-time" label="Horário" type="time" value={form.startTime} onChange={set('startTime')} required />
        </div>

        {/* ── Seção do cliente ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>Cliente</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={switchToSearch}
                className="rounded-lg px-2.5 py-1 text-xs transition-colors"
                style={clientMode === 'search'
                  ? { background: 'var(--agendou-gradient)', color: '#fff' }
                  : { backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text-muted)', border: '1px solid var(--agendou-border)' }
                }
              >
                Buscar cadastrado
              </button>
              <button
                type="button"
                onClick={switchToNew}
                className="rounded-lg px-2.5 py-1 text-xs transition-colors"
                style={clientMode === 'new'
                  ? { background: 'var(--agendou-gradient)', color: '#fff' }
                  : { backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text-muted)', border: '1px solid var(--agendou-border)' }
                }
              >
                + Novo cliente
              </button>
            </div>
          </div>

          {clientMode === 'search' ? (
            selectedClient ? (
              /* Cliente selecionado */
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--agendou-text)' }}>{selectedClient.full_name}</p>
                  {selectedClient.phone && (
                    <p className="text-xs" style={{ color: 'var(--agendou-text-muted)' }}>{selectedClient.phone}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearClient}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--agendou-text-faint)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--agendou-text-faint)' }}
                >
                  Trocar ✕
                </button>
              </div>
            ) : (
              /* Campo de busca */
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true) }}
                  onFocus={(e) => {
                    setShowDropdown(true)
                    e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--agendou-border)'
                    e.currentTarget.style.boxShadow = ''
                  }}
                  placeholder="Buscar por nome ou telefone..."
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
                  style={inputStyle}
                />

                {showDropdown && (filteredClients.length > 0 || searchQuery.trim().length >= 1) && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl shadow-xl"
                    style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
                  >
                    {filteredClients.length === 0 ? (
                      <div className="px-4 py-3">
                        <p className="text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
                          Nenhum cliente encontrado.
                        </p>
                        <button
                          type="button"
                          onClick={switchToNew}
                          className="mt-1 text-xs font-medium"
                          style={{ color: '#A78BFA' }}
                        >
                          + Cadastrar novo cliente
                        </button>
                      </div>
                    ) : (
                      filteredClients.map((c, i) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectClient(c)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={i > 0 ? { borderTop: '1px solid var(--agendou-border)' } : {}}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--agendou-surface-2)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ background: 'var(--agendou-gradient)' }}
                          >
                            {c.full_name[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" style={{ color: 'var(--agendou-text)' }}>{c.full_name}</p>
                            <p className="truncate text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
                              {c.phone ?? c.email ?? 'Sem contato'}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            /* Novo cliente */
            <div className="flex flex-col gap-2">
              <input
                required={clientMode === 'new'}
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nome do cliente *"
                className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
                style={inputStyle}
                {...focusHandlers}
              />
              <input
                type="tel"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Telefone (opcional)"
                className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
                style={inputStyle}
                {...focusHandlers}
              />
              <p className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>
                Você pode completar o cadastro depois em Clientes.
              </p>
            </div>
          )}
        </div>

        {/* Resumo */}
        {selectedService && (
          <p className="text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
            Término previsto: {form.startTime} + {selectedService.duration_min} min · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
          </p>
        )}

        {/* Notas internas */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
            Notas internas <span className="font-normal opacity-50">(opcional)</span>
          </label>
          <textarea value={form.internalNotes} onChange={set('internalNotes')} rows={2}
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
          <Button type="submit" loading={loading}>Agendar</Button>
        </div>
      </form>
    </Modal>
  )
}
