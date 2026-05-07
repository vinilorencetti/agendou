import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { notFound } from 'next/navigation'
import ClientSignupForm from './client-signup-form'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ redirect?: string }> }

export default async function ClientSignupPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { redirect: redirectTo } = await searchParams

  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(redirectTo ?? `/${slug}`)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-16 w-16 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold shadow-md"
              style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
            >
              {tenant.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{tenant.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">Crie sua conta para agendar</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <ClientSignupForm slug={slug} redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <a
            href={`/${slug}/entrar${redirectTo ? `?redirect=${redirectTo}` : ''}`}
            className="font-medium underline"
            style={{ color: 'var(--color-brand)' }}
          >
            Fazer login
          </a>
        </p>
      </div>
    </main>
  )
}
