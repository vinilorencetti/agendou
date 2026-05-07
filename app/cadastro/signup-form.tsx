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

  if (done) {
    return (
      <div className="rounded-lg border bg-gray-50 p-6 text-center">
        <p className="text-2xl">📬</p>
        <h2 className="mt-3 font-semibold">Confirme seu e-mail</h2>
        <p className="mt-2 text-sm text-gray-500">
          Enviamos um link para <strong>{fields.email}</strong>.
          Clique nele para ativar sua conta e continuar.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
          Seu nome
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          required
          value={fields.fullName}
          onChange={set('fullName')}
          placeholder="João Silva"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={fields.email}
          onChange={set('email')}
          placeholder="joao@barbearia.com"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={fields.password}
          onChange={set('password')}
          placeholder="Mínimo 8 caracteres"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Criando conta...' : 'Criar conta grátis'}
      </button>
    </form>
  )
}
