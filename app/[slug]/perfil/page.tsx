import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import BottomNav from '@/components/ui/bottom-nav'
import LogoutButton from './logout-button'

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
    .select('full_name, phone, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const name = profile?.full_name ?? user.email ?? 'Cliente'
  const email = user.email ?? ''

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-8">
      <h1 className="mb-6 text-xl font-bold">Meu perfil</h1>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
            style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
          >
            {name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <a
          href={`/${slug}/meus-agendamentos`}
          className="flex w-full items-center justify-between rounded-2xl border bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📅</span>
            <span className="font-medium">Meus agendamentos</span>
          </div>
          <span className="text-gray-400">›</span>
        </a>
      </div>

      <div className="mt-3">
        <LogoutButton slug={slug} />
      </div>
    </main>
  )
}
