'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/app/actions/auth'

export default function SignUpForm() {
  const router = useRouter()
  const [fields, setFields] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fields.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    setLoading(true)
    setError(null)

    const result = await signUp(fields)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.requiresEmailConfirmation) {
      setDone(true)
    } else {
      router.push('/onboarding')
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--agendou-surface-2)',
    color: 'var(--agendou-text)',
    border: '1px solid var(--agendou-border)',
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
  }
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'var(--agendou-border)'
    e.currentTarget.style.boxShadow = ''
  }

  if (done) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--agendou-surface-2)', border: '1px solid var(--agendou-border)' }}>
        <p className="text-3xl">📬</p>
        <h2 className="mt-3 font-semibold" style={{ color: 'var(--agendou-text)' }}>Confirme seu e-mail</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
          Enviamos um link para <strong style={{ color: 'var(--agendou-text)' }}>{fields.email}</strong>.
          Clique nele para ativar sua conta e continuar.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {[
        { id: 'fullName', label: 'Seu nome', type: 'text', autoComplete: 'name', placeholder: 'João Silva', key: 'fullName' as const },
        { id: 'email', label: 'E-mail', type: 'email', autoComplete: 'email', placeholder: 'joao@barbearia.com', key: 'email' as const },
        { id: 'password', label: 'Senha', type: 'password', autoComplete: 'new-password', placeholder: 'Mínimo 8 caracteres', key: 'password' as const },
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
            className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
        className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'var(--agendou-gradient)' }}
      >
        {loading ? 'Criando conta...' : 'Criar conta grátis'}
      </button>
    </form>
  )
}
