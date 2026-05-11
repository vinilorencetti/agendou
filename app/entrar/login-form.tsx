'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push(redirectTo ?? '/')
    router.refresh()
  }

  const inputStyle = {
    backgroundColor: 'var(--agendou-surface-2)',
    color: 'var(--agendou-text)',
    border: '1px solid var(--agendou-border)',
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--agendou-border)'
            e.currentTarget.style.boxShadow = ''
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--agendou-border)'
            e.currentTarget.style.boxShadow = ''
          }}
        />
      </div>

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
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
        Não tem conta?{' '}
        <a href="/cadastro" className="font-medium underline" style={{ color: 'var(--color-brand-secondary)' }}>
          Cadastre seu negócio
        </a>
      </p>
    </form>
  )
}
