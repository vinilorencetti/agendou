import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Configure seu negócio' }

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar?redirect=/onboarding')

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <span className="font-bold">Agendou</span>
      </header>
      <main className="flex flex-1 items-start justify-center p-6 pt-12">
        {children}
      </main>
    </div>
  )
}
