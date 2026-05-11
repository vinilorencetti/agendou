import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignUpForm from './signup-form'
import Link from 'next/link'

export const metadata = { title: 'Cadastre seu negócio — Agendou' }

export default async function CadastroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/onboarding')

  return (
    <main className="flex min-h-screen" style={{ backgroundColor: 'var(--agendou-bg)' }}>

      {/* ── Painel esquerdo — branding (só desktop) ── */}
      <div
        className="hidden lg:flex lg:w-[480px] lg:shrink-0 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #1a0533 0%, #0D0B12 60%)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            A
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--agendou-text)' }}>Agendou</span>
        </div>

        <div>
          <h1 className="text-4xl font-black leading-tight" style={{ color: 'var(--agendou-text)' }}>
            Configure seu<br />negócio em<br />minutos.
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--agendou-text-muted)' }}>
            Crie sua conta gratuita e comece a receber agendamentos online hoje mesmo.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {[
              { icon: '✓', text: 'Sem cartão de crédito' },
              { icon: '✓', text: 'Configuração em menos de 5 minutos' },
              { icon: '✓', text: 'Cancele quando quiser' },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
                <span className="font-bold" style={{ color: '#A78BFA' }}>{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div
            className="mt-8 rounded-2xl p-4"
            style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--agendou-text-muted)' }}>
              "Triplicamos o número de agendamentos no primeiro mês. O Agendou é indispensável."
            </p>
            <p className="mt-2 text-xs font-semibold" style={{ color: '#A78BFA' }}>
              — Carlos M., Barbearia Premium SP
            </p>
          </div>
        </div>

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
            <h2 className="text-2xl font-bold" style={{ color: 'var(--agendou-text)' }}>Crie sua conta</h2>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
              Grátis para começar. Sem compromisso.
            </p>
          </div>

          <div
            className="rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
          >
            <SignUpForm />
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
            Já tem conta?{' '}
            <Link href="/entrar" className="font-semibold transition-opacity hover:opacity-80" style={{ color: '#A78BFA' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
