import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import BottomNav from '@/components/ui/bottom-nav'
import LogoutButton from '@/components/ui/logout-button'

type Props = { params: Promise<{ slug: string }> }

export default async function ClientProfilePage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${slug}/entrar?redirect=/${slug}/perfil`)

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle()

  const name = profile?.full_name ?? user.email ?? 'Cliente'
  const email = user.email ?? ''

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-8">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Meu perfil</h1>

      {/* Cartão do usuário */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
          style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
        >
          {name[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{name}</p>
          <p className="truncate text-sm text-gray-500">{email}</p>
        </div>
      </div>

      {/* Ações */}
      <div className="mt-4 space-y-2.5">
        <a
          href={`/${slug}/meus-agendamentos`}
          className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
              style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)', opacity: 0.9 }}
            >
              📅
            </span>
            <span className="font-medium text-gray-900">Meus agendamentos</span>
          </div>
          <span className="text-gray-400">›</span>
        </a>

        <LogoutButton
          redirectTo={`/${slug}`}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-red-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-base">
            🚪
          </span>
          <span className="font-medium text-red-500">Sair da conta</span>
        </LogoutButton>
      </div>

      <BottomNav slug={slug} />
    </div>
  )
}
