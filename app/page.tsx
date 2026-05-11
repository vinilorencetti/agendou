import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8" style={{ backgroundColor: 'var(--agendou-bg)' }}>
      {/* Logo mark */}
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg shadow-violet-900/40"
        style={{ background: 'var(--agendou-gradient)' }}
      >
        A
      </div>

      <h1 className="text-5xl font-black tracking-tight" style={{ color: 'var(--agendou-text)' }}>
        Agendou
      </h1>
      <p className="mt-3 text-lg" style={{ color: 'var(--agendou-text-muted)' }}>
        O funcionário da sua empresa.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/cadastro"
          className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--agendou-gradient)' }}
        >
          Começar grátis
        </Link>
        <Link
          href="/entrar"
          className="rounded-xl px-8 py-3 text-sm font-semibold transition-colors"
          style={{ color: 'var(--agendou-text-muted)', border: '1px solid var(--agendou-border)' }}
        >
          Entrar
        </Link>
      </div>
    </main>
  )
}
