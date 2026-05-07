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

    // Cria perfil público
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        full_name: fields.name,
      })
    }

    // Se a sessão foi criada imediatamente (sem confirmação de e-mail)
    if (data.session) {
      router.push(redirectTo ?? `/${slug}`)
      router.refresh()
    } else {
      // Email confirmation required
      router.push(`/${slug}/entrar?msg=confirme-email`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Seu nome
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          required
          value={fields.name}
          onChange={set('name')}
          placeholder="Como quer ser chamado"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-shadow focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={fields.email}
          onChange={set('email')}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-shadow focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={fields.password}
          onChange={set('password')}
          placeholder="Mínimo 6 caracteres"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-shadow focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 w-full rounded-xl py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
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
