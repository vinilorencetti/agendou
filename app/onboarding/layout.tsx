import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Configure seu negócio' }

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar?redirect=/onboarding')

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--agendou-bg)' }}>
      {/* Header */}
      <header
        className="flex h-14 items-center px-6"
        style={{ borderBottom: '1px solid var(--agendou-border)', backgroundColor: 'var(--agendou-surface)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            A
          </div>
          <span className="font-bold tracking-tight" style={{ color: 'var(--agendou-text)' }}>Agendou</span>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center p-6 pt-12">
        {children}
      </main>
    </div>
  )
}
