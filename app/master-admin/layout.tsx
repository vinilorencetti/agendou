import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/logout-button'

export default async function MasterAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar?redirect=/master-admin')

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'master_admin')
    .eq('is_active', true)
    .single()

  if (!role) redirect('/')

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--agendou-bg)', color: 'var(--agendou-text)' }}>
      <aside
        className="flex w-52 flex-col"
        style={{ backgroundColor: 'var(--agendou-surface)', borderRight: '1px solid var(--agendou-border)' }}
      >
        <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: '1px solid var(--agendou-border)' }}>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            A
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--agendou-text-faint)' }}>Agendou</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--agendou-text)' }}>Master Admin</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
          {[
            { label: 'Visão geral', href: '/master-admin' },
            { label: 'Tenants', href: '/master-admin/tenants' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--agendou-text-muted)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-2" style={{ borderTop: '1px solid var(--agendou-border)' }}>
          <LogoutButton
            redirectTo="/entrar"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
            style={{ color: 'var(--agendou-text-faint)' } as React.CSSProperties}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
              <path strokeLinecap="round" d="M10 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3M7 11l3-3-3-3M10 8H2" />
            </svg>
            Sair
          </LogoutButton>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
