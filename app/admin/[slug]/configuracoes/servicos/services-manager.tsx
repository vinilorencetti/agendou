'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { createService, updateService, deleteService, toggleServiceActive } from '@/app/actions/services'
import type { Database } from '@/types/database'

type Service = Database['public']['Tables']['services']['Row']

type FormState = {
  name: string
  description: string
  durationMin: string
  price: string
}

const EMPTY_FORM: FormState = { name: '', description: '', durationMin: '30', price: '' }

export default function ServicesManager({
  tenantId,
  initialServices,
}: {
  tenantId: string
  initialServices: Service[]
}) {
  const [services, setServices] = useState(initialServices)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setError(null)
    setModal('create')
  }

  function openEdit(service: Service) {
    setForm({
      name: service.name,
      description: service.description ?? '',
      durationMin: String(service.duration_min),
      price: String(service.price),
    })
    setEditing(service)
    setError(null)
    setModal('edit')
  }

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function closeModal() {
    setModal(null)
    setEditing(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      tenantId,
      name: form.name,
      description: form.description,
      durationMin: parseInt(form.durationMin),
      price: parseFloat(form.price),
    }

    const result = modal === 'create'
      ? await createService(payload)
      : await updateService(editing!.id, payload)

    if (!result.success) {
      setError(result.error ?? 'Erro desconhecido.')
      setLoading(false)
      return
    }

    // Atualiza lista localmente para feedback imediato
    if (modal === 'create') {
      setServices((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          name: form.name,
          description: form.description || null,
          duration_min: parseInt(form.durationMin),
          price: parseFloat(form.price),
          is_active: true,
          display_order: prev.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    } else if (editing) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editing.id
            ? { ...s, name: form.name, description: form.description || null, duration_min: parseInt(form.durationMin), price: parseFloat(form.price) }
            : s
        )
      )
    }

    setLoading(false)
    closeModal()
  }

  async function handleDelete(service: Service) {
    if (!confirm(`Excluir "${service.name}"? Esta ação não pode ser desfeita.`)) return
    const result = await deleteService(service.id, tenantId)
    if (result.success) setServices((prev) => prev.filter((s) => s.id !== service.id))
  }

  async function handleToggle(service: Service) {
    const next = !service.is_active
    setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, is_active: next } : s)))
    await toggleServiceActive(service.id, tenantId, next)
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>+ Novo serviço</Button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-gray-400">Nenhum serviço cadastrado.</p>
          <p className="mt-1 text-sm text-gray-400">Clique em "Novo serviço" para começar.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {services.map((service) => (
            <li
              key={service.id}
              className={`flex items-center justify-between rounded-lg border bg-white p-4 transition-opacity ${!service.is_active ? 'opacity-50' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{service.name}</p>
                  {!service.is_active && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      Inativo
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {service.duration_min} min ·{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                </p>
                {service.description && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">{service.description}</p>
                )}
              </div>

              <div className="ml-4 flex items-center gap-1">
                <button
                  onClick={() => handleToggle(service)}
                  title={service.is_active ? 'Desativar' : 'Ativar'}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  {service.is_active ? '👁' : '🚫'}
                </button>
                <button
                  onClick={() => openEdit(service)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(service)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal === 'create' ? 'Novo serviço' : 'Editar serviço'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            id="svc-name"
            label="Nome do serviço"
            placeholder="Ex: Corte masculino"
            required
            value={form.name}
            onChange={set('name')}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="svc-desc" className="text-sm font-medium text-gray-700">
              Descrição <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              id="svc-desc"
              value={form.description}
              onChange={set('description')}
              rows={2}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex gap-3">
            <Input
              id="svc-duration"
              label="Duração (min)"
              type="number"
              min="5"
              step="5"
              required
              value={form.durationMin}
              onChange={set('durationMin')}
              className="w-32"
            />
            <div className="flex-1">
              <Input
                id="svc-price"
                label="Preço (R$)"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0,00"
                value={form.price}
                onChange={set('price')}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {modal === 'create' ? 'Criar serviço' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
