'use client'

import { useState } from 'react'
import ColorPicker from '@/components/ui/color-picker'
import ImageUpload from '@/components/ui/image-upload'
import Button from '@/components/ui/button'
import { updateTenantAppearance } from '@/app/actions/settings'
import type { Database } from '@/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row'] & { secondary_color: string }

type AppearanceState = {
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
}

export default function AppearanceEditor({ tenant }: { tenant: Tenant }) {
  const [state, setState] = useState<AppearanceState>({
    logoUrl: tenant.logo_url ?? '',
    primaryColor: tenant.primary_color,
    secondaryColor: tenant.secondary_color,
    backgroundColor: tenant.background_color,
  })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof AppearanceState>(key: K, value: AppearanceState[K]) {
    setState((s) => ({ ...s, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const result = await updateTenantAppearance(tenant.id, tenant.slug, {
      logoUrl: state.logoUrl,
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
      backgroundColor: state.backgroundColor,
    })

    if (!result.success) setError(result.error ?? 'Erro desconhecido.')
    else setSaved(true)
    setLoading(false)
  }

  // Cor de texto automática baseada no brilho do fundo
  function contrastColor(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#111111' : '#ffffff'
  }

  const previewTextColor = contrastColor(state.primaryColor)

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Controles ── */}
      <div className="flex flex-col gap-6">
        {/* Logo */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}>
          <h2 className="mb-1 font-semibold" style={{ color: 'var(--agendou-text)' }}>Logo</h2>
          <p className="mb-4 text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
            Aparece no cabeçalho da página dos seus clientes.
          </p>
          <ImageUpload
            bucket="logos"
            path={tenant.id}
            currentUrl={state.logoUrl || null}
            shape="square"
            size={88}
            onUpload={(url) => set('logoUrl', url)}
            onError={setUploadError}
          />
          {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}
        </div>

        {/* Cores */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}>
          <h2 className="mb-1 font-semibold" style={{ color: 'var(--agendou-text)' }}>Cores</h2>
          <p className="mb-4 text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
            Aplicadas na página pública dos seus clientes.
          </p>
          <div className="flex flex-col gap-4">
            <ColorPicker
              label="Cor primária"
              value={state.primaryColor}
              onChange={(c) => set('primaryColor', c)}
              hint="Botões, destaques e elementos principais."
            />
            <ColorPicker
              label="Cor secundária"
              value={state.secondaryColor}
              onChange={(c) => set('secondaryColor', c)}
              hint="Badges, ícones e elementos de apoio."
            />
            <ColorPicker
              label="Cor de fundo"
              value={state.backgroundColor}
              onChange={(c) => set('backgroundColor', c)}
              hint="Fundo geral da página."
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={loading}>Salvar aparência</Button>
          {saved && <span className="text-sm" style={{ color: '#4ADE80' }}>✓ Salvo</span>}
        </div>
      </div>

      {/* ── Preview ao vivo ── */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--agendou-text-faint)' }}>
          Preview — página do cliente
        </p>
        <div
          className="overflow-hidden rounded-2xl shadow-sm"
          style={{ border: '1px solid var(--agendou-border)' }}
          style={{ backgroundColor: state.backgroundColor }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ backgroundColor: state.primaryColor }}
          >
            {state.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.logoUrl}
                alt="logo"
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
                style={{ backgroundColor: state.secondaryColor, color: contrastColor(state.secondaryColor) }}
              >
                {tenant.name[0].toUpperCase()}
              </div>
            )}
            <span
              className="text-lg font-bold"
              style={{ color: previewTextColor }}
            >
              {tenant.name}
            </span>
          </div>

          {/* Body */}
          <div className="p-5">
            {/* Serviços simulados */}
            <p
              className="mb-3 text-sm font-semibold"
              style={{ color: contrastColor(state.backgroundColor) }}
            >
              Serviços
            </p>
            {[
              { name: 'Corte masculino', duration: '30 min', price: 'R$ 50' },
              { name: 'Barba completa', duration: '20 min', price: 'R$ 35' },
            ].map((s) => (
              <div
                key={s.name}
                className="mb-2 flex items-center justify-between rounded-lg border px-4 py-3"
                style={{ backgroundColor: state.backgroundColor, borderColor: `${state.primaryColor}33` }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: contrastColor(state.backgroundColor) }}>
                    {s.name}
                  </p>
                  <p className="text-xs" style={{ color: state.secondaryColor }}>
                    {s.duration}
                  </p>
                </div>
                <span className="text-sm font-semibold" style={{ color: state.primaryColor }}>
                  {s.price}
                </span>
              </div>
            ))}

            {/* CTA */}
            <button
              className="mt-4 w-full rounded-lg py-3 text-sm font-semibold transition-opacity"
              style={{
                backgroundColor: state.primaryColor,
                color: previewTextColor,
              }}
            >
              Agendar horário
            </button>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--agendou-text-faint)' }}>
          Este é um preview — a página real pode variar levemente.
        </p>
      </div>
    </div>
  )
}
