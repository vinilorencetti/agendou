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

  // Atualiza slug automaticamente quando o nome muda (a menos que o usuário tenha editado manualmente)
  useEffect(() => {
    if (!slugEdited && form.businessName) {
      setForm((f) => ({ ...f, slug: generateSlug(form.businessName) }))
    }
  }, [form.businessName, slugEdited])

  // Debounce da verificação de slug
  const checkSlug = useCallback(
    debounce(async (slug: string) => {
      if (!slug || slug.length < 3) {
        setSlugStatus('idle')
        return
      }
      setSlugStatus('checking')
      const result = await checkSlugAvailability(slug)
      if (result.available) {
        setSlugStatus('available')
      } else {
        setSlugStatus(result.reason === 'invalid' ? 'invalid' : 'taken')
      }
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

  function next() {
    setError(null)
    const idx = STEPS.indexOf(step)
    setStep(STEPS[idx + 1])
  }

  function back() {
    setError(null)
    const idx = STEPS.indexOf(step)
    setStep(STEPS[idx - 1])
  }

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
  const canProceedBusiness =
    form.businessName.trim().length >= 3 &&
    slugStatus === 'available'

  return (
    <div className="w-full max-w-md">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < stepIndex
                    ? 'bg-black text-white'
                    : i === stepIndex
                    ? 'border-2 border-black bg-white text-black'
                    : 'border border-gray-200 bg-white text-gray-400'
                }`}
              >
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span
                className={`text-sm ${
                  i === stepIndex ? 'font-medium text-black' : 'text-gray-400'
                }`}
              >
                {STEP_LABELS[s]}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 ${i < stepIndex ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        {/* Step 1 — Negócio */}
        {step === 'business' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold">
                {firstName ? `Olá, ${firstName}! ` : ''}Qual é o nome do seu negócio?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Você pode mudar isso depois nas configurações.
              </p>
            </div>

            <div>
              <label htmlFor="businessName" className="mb-1 block text-sm font-medium">
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
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium">
                Endereço da sua página
              </label>
              <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-black">
                <span className="select-none rounded-l-md border-r bg-gray-50 px-3 py-2 text-xs text-gray-400">
                  agendou.com.br/
                </span>
                <input
                  id="slug"
                  type="text"
                  value={form.slug}
                  onChange={set('slug')}
                  placeholder="barbearia-do-joao"
                  className="flex-1 rounded-r-md px-3 py-2 text-sm outline-none"
                />
              </div>
              <SlugFeedback status={slugStatus} slug={form.slug} />
            </div>

            <button
              onClick={next}
              disabled={!canProceedBusiness}
              className="mt-2 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2 — Contato */}
        {step === 'contact' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold">Informações de contato</h2>
              <p className="mt-1 text-sm text-gray-500">Opcional — você pode preencher depois.</p>
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium">
                Telefone / WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="(11) 99999-9999"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="addressCity" className="mb-1 block text-sm font-medium">
                  Cidade
                </label>
                <input
                  id="addressCity"
                  type="text"
                  value={form.addressCity}
                  onChange={set('addressCity')}
                  placeholder="São Paulo"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="w-24">
                <label htmlFor="addressState" className="mb-1 block text-sm font-medium">
                  Estado
                </label>
                <select
                  id="addressState"
                  value={form.addressState}
                  onChange={set('addressState')}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
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
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                ← Voltar
              </button>
              <button
                onClick={next}
                className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
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
              <h2 className="text-lg font-semibold">Tudo certo?</h2>
              <p className="mt-1 text-sm text-gray-500">Revise antes de criar seu negócio.</p>
            </div>

            <dl className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4 text-sm">
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

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={back}
                disabled={submitting}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                ← Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
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
    checking: { color: 'text-gray-400', msg: 'Verificando disponibilidade…' },
    available: { color: 'text-green-600', msg: '✓ Disponível' },
    taken: { color: 'text-red-500', msg: '✗ Este endereço já está em uso.' },
    invalid: {
      color: 'text-red-500',
      msg: '✗ Use apenas letras minúsculas, números e hífens (mín. 3 caracteres).',
    },
  } as const

  const { color, msg } = map[status as keyof typeof map] ?? { color: '', msg: '' }
  return <p className={`mt-1 text-xs ${color}`}>{msg}</p>
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
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
