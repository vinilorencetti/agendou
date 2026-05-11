'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import ImageUpload from '@/components/ui/image-upload'
import ScheduleEditor from './schedule-editor'
import { createProfessional, updateProfessional, deleteProfessional } from '@/app/actions/professionals'
import CreateAccountModal from './create-account-modal'
import type { Database } from '@/types/database'

type Professional = Database['public']['Tables']['professionals']['Row'] & {
  professional_services: { service_id: string }[]
  professional_schedules: Database['public']['Tables']['professional_schedules']['Row'][]
}
type Service = Database['public']['Tables']['services']['Row']

type FormState = {
  name: string
  bio: string
  commissionPct: string
  serviceIds: string[]
  avatarUrl: string
}

const EMPTY_FORM: FormState = { name: '', bio: '', commissionPct: '0', serviceIds: [], avatarUrl: '' }

export default function ProfessionalsManager({
  tenantId,
  initialProfessionals,
  services,
}: {
  tenantId: string
  initialProfessionals: Professional[]
  services: Service[]
}) {
  const [professionals, setProfessionals] = useState(initialProfessionals)
  const [modal, setModal] = useState<'create' | 'edit' | 'schedule' | 'account' | null>(null)
  const [editing, setEditing] = useState<Professional | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setError(null)
    setModal('create')
  }

  function openEdit(pro: Professional) {
    setForm({
      name: pro.name,
      bio: pro.bio ?? '',
      commissionPct: String(pro.commission_pct),
      serviceIds: pro.professional_services.map((ps) => ps.service_id),
      avatarUrl: pro.avatar_url ?? '',
    })
    setEditing(pro)
    setError(null)
    setModal('edit')
  }

  function openSchedule(pro: Professional) {
    setEditing(pro)
    setModal('schedule')
  }

  function openAccount(pro: Professional) {
    setEditing(pro)
    setModal('account')
  }

  function set(key: keyof Omit<FormState, 'serviceIds'>) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function toggleService(id: string) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter((s) => s !== id)
        : [...f.serviceIds, id],
    }))
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
      bio: form.bio,
      commissionPct: parseFloat(form.commissionPct) || 0,
      serviceIds: form.serviceIds,
      avatarUrl: form.avatarUrl,
    }

    const result = modal === 'create'
      ? await createProfessional(payload)
      : await updateProfessional(editing!.id, payload)

    if (!result.success) {
      setError(result.error ?? 'Erro desconhecido.')
      setLoading(false)
      return
    }

    setLoading(false)
    closeModal()
    window.location.reload()
  }

  async function handleDelete(pro: Professional) {
    if (!confirm(`Excluir "${pro.name}"? Esta ação não pode ser desfeita.`)) return
    const result = await deleteProfessional(pro.id, tenantId)
    if (result.success) setProfessionals((prev) => prev.filter((p) => p.id !== pro.id))
  }

  const cardStyle = {
    backgroundColor: 'var(--agendou-surface)',
    border: '1px solid var(--agendou-border)',
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>+ Novo profissional</Button>
      </div>

      {professionals.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ ...cardStyle, borderStyle: 'dashed' }}>
          <p style={{ color: 'var(--agendou-text-faint)' }}>Nenhum profissional cadastrado.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--agendou-text-faint)' }}>Clique em "Novo profissional" para começar.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {professionals.map((pro) => (
            <li key={pro.id} className="rounded-xl p-4" style={cardStyle}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {pro.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pro.avatar_url}
                        alt={pro.name}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                        style={{ background: 'var(--agendou-gradient)', color: '#fff' }}
                      >
                        {pro.name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium" style={{ color: 'var(--agendou-text)' }}>{pro.name}</p>
                      {pro.bio && <p className="text-xs" style={{ color: 'var(--agendou-text-muted)' }}>{pro.bio}</p>}
                    </div>
                  </div>

                  {pro.professional_services.length > 0 && (
                    <div className="mt-2 ml-11 flex flex-wrap gap-1">
                      {pro.professional_services.map(({ service_id }) => {
                        const svc = services.find((s) => s.id === service_id)
                        return svc ? (
                          <span
                            key={service_id}
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}
                          >
                            {svc.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openSchedule(pro)}
                    title="Horários"
                    className="rounded-lg px-2 py-1.5 text-xs transition-colors"
                    style={{ color: 'var(--agendou-text-muted)', backgroundColor: 'var(--agendou-surface-2)' }}
                  >
                    📅 Horários
                  </button>

                  {/* Acesso do profissional */}
                  {pro.user_id ? (
                    <span
                      title="Acesso ativo"
                      className="rounded-lg px-2 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ADE80' }}
                    >
                      🔑 Ativo
                    </span>
                  ) : (
                    <button
                      onClick={() => openAccount(pro)}
                      title="Criar acesso"
                      className="rounded-lg px-2 py-1.5 text-xs transition-colors"
                      style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#A78BFA' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.22)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.12)' }}
                    >
                      🔑 Criar acesso
                    </button>
                  )}

                  <button
                    onClick={() => openEdit(pro)}
                    className="rounded-lg p-1.5 transition-colors"
                    style={{ color: 'var(--agendou-text-faint)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--agendou-surface-2)'; e.currentTarget.style.color = 'var(--agendou-text)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--agendou-text-faint)' }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(pro)}
                    className="rounded-lg p-1.5 transition-colors"
                    style={{ color: 'var(--agendou-text-faint)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#F87171' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--agendou-text-faint)' }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal: criar / editar profissional */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'create' ? 'Novo profissional' : 'Editar profissional'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Foto do profissional */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              Foto <span className="font-normal opacity-50">(opcional)</span>
            </p>
            <ImageUpload
              bucket="avatars"
              path={`${tenantId}/${editing?.id ?? 'new'}`}
              currentUrl={form.avatarUrl || null}
              shape="circle"
              size={72}
              onUpload={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
            />
          </div>

          <Input
            id="pro-name"
            label="Nome"
            placeholder="Ex: Carlos"
            required
            value={form.name}
            onChange={set('name')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pro-bio" className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              Bio <span className="font-normal opacity-50">(opcional)</span>
            </label>
            <textarea
              id="pro-bio"
              value={form.bio}
              onChange={set('bio')}
              rows={2}
              placeholder="Ex: Especialista em degradê e barba"
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
              style={{ backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text)', border: '1px solid var(--agendou-border)' }}
            />
          </div>

          <Input
            id="pro-commission"
            label="Comissão (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={form.commissionPct}
            onChange={set('commissionPct')}
          />

          {services.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>Serviços que executa</p>
              <div className="flex flex-wrap gap-2">
                {services.map((svc) => {
                  const checked = form.serviceIds.includes(svc.id)
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => toggleService(svc.id)}
                      className="rounded-full px-3 py-1 text-xs transition-all"
                      style={checked
                        ? { background: 'var(--agendou-gradient)', color: '#fff', border: '1px solid transparent' }
                        : { backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text-muted)', border: '1px solid var(--agendou-border)' }
                      }
                    >
                      {svc.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {modal === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: horários do profissional */}
      {editing && (
        <Modal
          open={modal === 'schedule'}
          onClose={closeModal}
          title={`Horários — ${editing.name}`}
        >
          <ScheduleEditor
            professionalId={editing.id}
            tenantId={tenantId}
            initialSchedules={editing.professional_schedules}
            onClose={closeModal}
          />
        </Modal>
      )}

      {/* Modal: criar acesso adm_basico */}
      {editing && modal === 'account' && (
        <CreateAccountModal
          open
          onClose={closeModal}
          professionalId={editing.id}
          professionalName={editing.name}
          tenantId={tenantId}
          onSuccess={() => {
            setProfessionals((prev) =>
              prev.map((p) =>
                p.id === editing.id ? { ...p, user_id: '__pending__' } : p
              )
            )
          }}
        />
      )}
    </>
  )
}
