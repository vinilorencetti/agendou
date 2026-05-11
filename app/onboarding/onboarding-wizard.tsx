'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/slug'
import { checkSlugAvailability, createTenant } from '@/app/actions/tenant'

type Step = 'business' | 'contact' | 'confirm'

type FormData = {
  businessName: string
  slug: string
  phone: string
  addressCity: string
  addressState: string
}

const STEPS: Step[] = ['business', 'contact', 'confirm']

const STEP_LABELS: Record<Step, string> = {
  business: 'Seu negócio',
  contact: 'Contato',
  confirm: 'Confirmar',
}

const inputStyle = {
  backgroundColor: 'var(--agendou-surface-2)',
  color: 'var(--agendou-text)',
  border: '1px solid var(--agendou-border)',
}

function useInputHandlers() {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'var(--agendou-border)'
      e.currentTarget.style.boxShadow = ''
    },
  }
}

export default function OnboardingWizard({ userName }: { userName: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('business')
  const [form, setForm] = useState<FormData>({
    businessName: '',
    slug: '',
    phone: '',
    addressCity: '',
    addressState: '',
  })
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugEdited, setSlugEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const firstName = userName.split(' ')[0]
  const inputHandlers = useInputHandlers()

  useEffect(() => {
    if (!slugEdited && form.businessName) {
      setForm((f) => ({ ...f, slug: generateSlug(form.businessName) }))
    }
  }, [form.businessName, slugEdited])

  const checkSlug = useCallback(
    debounce(async (slug: string) => {
      if (!slug || slug.length < 3) { setSlugStatus('idle'); return }
      setSlugStatus('checking')
      const result = await checkSlugAvailability(slug)
      setSlugStatus(result.available ? 'available' : (result.reason === 'invalid' ? 'invalid' : 'taken'))
    }, 500),
    []
  )

  useEffect(() => {
    if (form.slug) checkSlug(form.slug)
  }, [form.slug, checkSlug])

  function set(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      if (key === 'slug') setSlugEdited(true)
    }
  }

  function next() { setError(null); setStep(STEPS[STEPS.indexOf(step) + 1]) }
  function back() { setError(null); setStep(STEPS[STEPS.indexOf(step) - 1]) }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    const result = await createTenant({
      businessName: form.businessName,
      slug: form.slug,
      phone: form.phone,
      addressCity: form.addressCity,
      addressState: form.addressState,
    })

    if (!result.success) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    router.push(`/admin/${result.slug}?welcome=1`)
  }

  const stepIndex = STEPS.indexOf(step)
  const canProceedBusiness = form.businessName.trim().length >= 3 && slugStatus === 'available'

  return (
    <div className="w-full max-w-md">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all"
                style={
                  i < stepIndex
                    ? { background: 'var(--agendou-gradient)', color: '#fff' }
                    : i === stepIndex
                    ? { border: '2px solid #7C3AED', color: '#C4B5FD', backgroundColor: 'rgba(124,58,237,0.15)' }
                    : { border: '1px solid var(--agendou-border)', color: 'var(--agendou-text-faint)', backgroundColor: 'var(--agendou-surface-2)' }
                }
              >
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span
                className="text-sm"
                style={{ color: i === stepIndex ? 'var(--agendou-text)' : 'var(--agendou-text-faint)', fontWeight: i === stepIndex ? 600 : 400 }}
              >
                {STEP_LABELS[s]}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className="h-px w-6 transition-colors"
                  style={{ backgroundColor: i < stepIndex ? '#7C3AED' : 'var(--agendou-border)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
      >
        {/* Step 1 — Negócio */}
        {step === 'business' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--agendou-text)' }}>
                {firstName ? `Olá, ${firstName}! ` : ''}Qual é o nome do seu negócio?
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
                Você pode mudar isso depois nas configurações.
              </p>
            </div>

            <div>
              <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
                Nome do negócio
              </label>
              <input
                id="businessName"
                type="text"
                required
                autoFocus
                value={form.businessName}
                onChange={set('businessName')}
                placeholder="Barbearia do João"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
                style={inputStyle}
                {...inputHandlers}
              />
            </div>

            <div>
              <label htmlFor="slug" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
                Endereço da sua página
              </label>
              <div
                className="flex items-center overflow-hidden rounded-xl transition-all"
                style={{ border: '1px solid var(--agendou-border)' }}
              >
                <span
                  className="select-none px-3 py-2.5 text-xs"
                  style={{ backgroundColor: 'var(--agendou-surface-2)', color: 'var(--agendou-text-faint)', borderRight: '1px solid var(--agendou-border)' }}
                >
                  agendou.com.br/
                </span>
                <input
                  id="slug"
                  type="text"
                  value={form.slug}
                  onChange={set('slug')}
                  placeholder="barbearia-do-joao"
                  className="flex-1 px-3 py-2.5 text-sm outline-none placeholder:opacity-40"
                  style={{ backgroundColor: 'var(--agendou-surface)', color: 'var(--agendou-text)' }}
                />
              </div>
              <SlugFeedback status={slugStatus} slug={form.slug} />
            </div>

            <button
              onClick={next}
              disabled={!canProceedBusiness}
              className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'var(--agendou-gradient)' }}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2 — Contato */}
        {step === 'contact' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--agendou-text)' }}>Informações de contato</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>Opcional — você pode preencher depois.</p>
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
                Telefone / WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
                style={inputStyle}
                {...inputHandlers}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="addressCity" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
                  Cidade
                </label>
                <input
                  id="addressCity"
                  type="text"
                  value={form.addressCity}
                  onChange={set('addressCity')}
                  placeholder="São Paulo"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
                  style={inputStyle}
                  {...inputHandlers}
                />
              </div>
              <div className="w-24">
                <label htmlFor="addressState" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
                  Estado
                </label>
                <select
                  id="addressState"
                  value={form.addressState}
                  onChange={set('addressState')}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  style={inputStyle}
                  {...inputHandlers}
                >
                  <option value="">UF</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={back}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
                style={{ border: '1px solid var(--agendou-border)', color: 'var(--agendou-text-muted)', backgroundColor: 'var(--agendou-surface-2)' }}
              >
                ← Voltar
              </button>
              <button
                onClick={next}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: 'var(--agendou-gradient)' }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Confirmar */}
        {step === 'confirm' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--agendou-text)' }}>Tudo certo?</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>Revise antes de criar seu negócio.</p>
            </div>

            <dl className="flex flex-col gap-3 rounded-xl p-4 text-sm" style={{ backgroundColor: 'var(--agendou-surface-2)', border: '1px solid var(--agendou-border)' }}>
              <Row label="Nome" value={form.businessName} />
              <Row label="Página" value={`agendou.com.br/${form.slug}`} />
              {form.phone && <Row label="Telefone" value={form.phone} />}
              {form.addressCity && (
                <Row
                  label="Localização"
                  value={[form.addressCity, form.addressState].filter(Boolean).join(' — ')}
                />
              )}
            </dl>

            {error && (
              <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={back}
                disabled={submitting}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ border: '1px solid var(--agendou-border)', color: 'var(--agendou-text-muted)', backgroundColor: 'var(--agendou-surface-2)' }}
              >
                ← Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'var(--agendou-gradient)' }}
              >
                {submitting ? 'Criando...' : 'Criar negócio 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SlugFeedback({
  status,
  slug,
}: {
  status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  slug: string
}) {
  if (!slug || status === 'idle') return null

  const map = {
    checking: { color: 'var(--agendou-text-faint)', msg: 'Verificando disponibilidade…' },
    available: { color: '#4ADE80', msg: '✓ Disponível' },
    taken: { color: '#F87171', msg: '✗ Este endereço já está em uso.' },
    invalid: { color: '#F87171', msg: '✗ Use apenas letras minúsculas, números e hífens (mín. 3 caracteres).' },
  } as const

  const { color, msg } = map[status as keyof typeof map] ?? { color: '', msg: '' }
  return <p className="mt-1 text-xs" style={{ color }}>{msg}</p>
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: 'var(--agendou-text-muted)' }}>{label}</dt>
      <dd className="text-right font-medium" style={{ color: 'var(--agendou-text)' }}>{value}</dd>
    </div>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]
