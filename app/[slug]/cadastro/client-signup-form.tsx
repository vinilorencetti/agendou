'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClientSignupForm({
  slug,
  redirectTo,
}: {
  slug: string
  redirectTo?: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [fields, setFields] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: fields.email,
      password: fields.password,
      options: {
        data: { full_name: fields.name },
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Este e-mail já está cadastrado. Faça login.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        full_name: fields.name,
      })
    }

    if (data.session) {
      router.push(redirectTo ?? `/${slug}`)
      router.refresh()
    } else {
      router.push(`/${slug}/entrar?msg=confirme-email`)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--agendou-surface-2)',
    color: 'var(--agendou-text)',
    border: '1px solid var(--agendou-border)',
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'var(--color-brand)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--color-brand-rgb),0.15)'
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'var(--agendou-border)'
    e.currentTarget.style.boxShadow = ''
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {[
        { id: 'name', label: 'Seu nome', type: 'text', autoComplete: 'name', placeholder: 'Como quer ser chamado', key: 'name' as const },
        { id: 'email', label: 'E-mail', type: 'email', autoComplete: 'email', placeholder: 'seu@email.com', key: 'email' as const },
        { id: 'password', label: 'Senha', type: 'password', autoComplete: 'new-password', placeholder: 'Mínimo 6 caracteres', key: 'password' as const },
      ].map(({ id, label, key, ...inputProps }) => (
        <div key={id} className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
            {label}
          </label>
          <input
            id={id}
            required
            value={fields[key]}
            onChange={set(key)}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:opacity-40"
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
            {...inputProps}
          />
        </div>
      ))}

      {error && (
        <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 w-full rounded-xl py-3 text-sm font-bold shadow-lg transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Criando conta...
          </span>
        ) : (
          'Criar conta'
        )}
      </button>
    </form>
  )
}
