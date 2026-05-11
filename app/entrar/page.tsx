import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export const metadata = { title: 'Entrar' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { redirect: redirectTo } = await searchParams

  if (user) {
    redirect(redirectTo ?? '/')
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'var(--agendou-bg)' }}
    >
      {/* Logo mark */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black shadow-lg shadow-violet-900/40"
          style={{ background: 'var(--agendou-gradient)' }}
        >
          A
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--agendou-text)' }}>
          Entrar no Agendou
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
          Bem-vindo de volta
        </p>
      </div>

      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
      >
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  )
}
