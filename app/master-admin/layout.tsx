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
    <div className="flex min-h-screen bg-gray-950 text-white">
      <aside className="flex w-52 flex-col border-r border-white/10">
        <div className="border-b border-white/10 px-4 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Agendou</p>
          <p className="mt-0.5 text-sm font-semibold text-white">Master Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
          {[
            { label: 'Visão geral', href: '/master-admin', icon: '▦' },
            { label: 'Tenants', href: '/master-admin/tenants', icon: '🏢' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-2">
          <LogoutButton
            redirectTo="/entrar"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-white/10 hover:text-red-400"
          >
            <span>⎋</span> Sair
          </LogoutButton>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
