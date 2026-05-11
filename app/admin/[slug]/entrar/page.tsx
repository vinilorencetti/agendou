import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import TenantLoginForm from './tenant-login-form'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function TenantLoginPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Já logado — verifica se tem acesso a este tenant
  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['adm_geral', 'adm_basico', 'master_admin'])
      .eq('is_active', true)
      .maybeSingle()

    if (roleData) redirect(`/admin/${slug}`)
  }

  const tenant = await getTenantBySlug(slug)
  if (!tenant) redirect('/')

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'var(--agendou-bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* Identidade do tenant */}
        <div className="mb-8 flex flex-col items-center text-center">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg shadow-violet-900/40"
              style={{ background: 'var(--agendou-gradient)' }}
            >
              {tenant.name[0].toUpperCase()}
            </div>
          )}
          <h1 className="text-xl font-bold" style={{ color: 'var(--agendou-text)' }}>
            {tenant.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
            Acesse o painel da equipe
          </p>
        </div>

        {/* Card do formulário */}
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
        >
          {error === 'no-access' && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
            >
              Você não tem acesso a este painel. Fale com o administrador.
            </div>
          )}

          <TenantLoginForm slug={slug} />
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--agendou-text-faint)' }}>
          Powered by{' '}
          <a href="/" className="font-semibold transition-opacity hover:opacity-80" style={{ color: '#A78BFA' }}>
            Agendou
          </a>
        </p>
      </div>
    </main>
  )
}
