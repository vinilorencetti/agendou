import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'
import Link from 'next/link'

export const metadata = { title: 'Entrar — Agendou' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { redirect: redirectTo } = await searchParams
  if (user) redirect(redirectTo ?? '/')

  return (
    <main className="flex min-h-screen" style={{ backgroundColor: 'var(--agendou-bg)' }}>

      {/* ── Painel esquerdo — branding (só desktop) ── */}
      <div
        className="hidden lg:flex lg:w-[480px] lg:shrink-0 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #1a0533 0%, #0D0B12 60%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            A
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--agendou-text)' }}>Agendou</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-4xl font-black leading-tight" style={{ color: 'var(--agendou-text)' }}>
            O funcionário<br />da sua empresa.
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--agendou-text-muted)' }}>
            Agenda, financeiro e equipe — tudo em um lugar só, para você focar no que realmente importa.
          </p>

          {/* Features */}
          <ul className="mt-8 flex flex-col gap-4">
            {[
              { icon: '📅', text: 'Agendamento online 24/7' },
              { icon: '💰', text: 'Controle financeiro completo' },
              { icon: '👥', text: 'Gestão de equipe e comissões' },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                  style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  {f.icon}
                </span>
                <span className="text-sm" style={{ color: 'var(--agendou-text-muted)' }}>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>
          © 2026 Agendou · Euforia Design
        </p>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">

        {/* Logo mobile */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg shadow-violet-900/40"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            A
          </div>
          <span className="mt-2 text-lg font-bold" style={{ color: 'var(--agendou-text)' }}>Agendou</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--agendou-text)' }}>Bem-vindo de volta</h2>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
              Entre na sua conta para acessar o painel.
            </p>
          </div>

          <div
            className="rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
          >
            <LoginForm redirectTo={redirectTo} />
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
            Não tem conta?{' '}
            <Link href="/cadastro" className="font-semibold transition-opacity hover:opacity-80" style={{ color: '#A78BFA' }}>
              Cadastre seu negócio grátis
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
