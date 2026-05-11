import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignUpForm from './signup-form'

export const metadata = { title: 'Cadastre seu negócio' }

export default async function CadastroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/onboarding')

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
          Crie sua conta
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
          Comece grátis. Configure seu negócio em minutos.
        </p>
      </div>

      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
      >
        <SignUpForm />

        <p className="mt-5 text-center text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
          Já tem conta?{' '}
          <a href="/entrar" className="font-medium underline" style={{ color: 'var(--color-brand-secondary)' }}>
            Entrar
          </a>
        </p>
      </div>
    </main>
  )
}
