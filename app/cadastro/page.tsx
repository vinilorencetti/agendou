import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignUpForm from './signup-form'

export const metadata = { title: 'Cadastre seu negócio' }

export default async function CadastroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/onboarding')

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Crie sua conta</h1>
          <p className="mt-2 text-sm text-gray-500">
            Comece grátis. Configure seu negócio em minutos.
          </p>
        </div>
        <SignUpForm />
        <p className="mt-4 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <a href="/entrar" className="underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  )
}
