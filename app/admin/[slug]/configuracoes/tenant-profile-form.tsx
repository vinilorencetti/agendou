'use client'

import { useState } from 'react'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { updateTenantProfile } from '@/app/actions/settings'
import type { Database } from '@/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row']

export default function TenantProfileForm({ tenant }: { tenant: Tenant }) {
  const [fields, setFields] = useState({
    name: tenant.name,
    description: tenant.description ?? '',
    phone: tenant.phone ?? '',
    cancellationPolicyHours: String(tenant.cancellation_policy_hours),
    whatsapp: tenant.whatsapp ?? '',
    instagram: tenant.instagram ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((f) => ({ ...f, [key]: e.target.value }))
      setSaved(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await updateTenantProfile(tenant.id, tenant.slug, {
      name: fields.name,
      description: fields.description,
      phone: fields.phone,
      cancellationPolicyHours: parseInt(fields.cancellationPolicyHours) || 2,
      whatsapp: fields.whatsapp,
      instagram: fields.instagram,
    })

    if (!result.success) setError(result.error ?? null)
    else setSaved(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="name"
        label="Nome do negócio"
        value={fields.name}
        onChange={set('name')}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
          Descrição <span className="font-normal opacity-50">(opcional)</span>
        </label>
        <textarea
          id="description"
          value={fields.description}
          onChange={set('description')}
          rows={2}
          placeholder="Ex: A melhor barbearia do bairro, especializada em cortes masculinos."
          className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none placeholder:opacity-40"
          style={{
            backgroundColor: 'var(--agendou-surface-2)',
            color: 'var(--agendou-text)',
            border: '1px solid var(--agendou-border)',
          }}
        />
      </div>
      <Input
        id="phone"
        label="Telefone"
        type="tel"
        placeholder="(11) 99999-9999"
        value={fields.phone}
        onChange={set('phone')}
      />
      <Input
        id="whatsapp"
        label="WhatsApp (número com DDD, sem espaços)"
        type="tel"
        placeholder="5511999999999"
        value={fields.whatsapp}
        onChange={set('whatsapp')}
      />
      <Input
        id="instagram"
        label="Instagram (@ do perfil)"
        placeholder="@seunegocio"
        value={fields.instagram}
        onChange={set('instagram')}
      />
      <Input
        id="cancellation"
        label="Política de cancelamento (horas de antecedência mínima)"
        type="number"
        min="0"
        max="72"
        value={fields.cancellationPolicyHours}
        onChange={set('cancellationPolicyHours')}
      />

      {error && (
        <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>Salvar</Button>
        {saved && <span className="text-sm" style={{ color: '#4ADE80' }}>✓ Salvo</span>}
      </div>
    </form>
  )
}
