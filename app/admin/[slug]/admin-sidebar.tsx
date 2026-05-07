'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/types/database'

type NavItem = {
  label: string
  href: string
  icon: string
  roles?: UserRole[]
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '', icon: '▦' },
  { label: 'Agenda', href: '/agenda', icon: '📅' },
  { label: 'Meu perfil', href: '/meu-perfil', icon: '👤', roles: ['adm_basico'] },
  { label: 'Clientes', href: '/clientes', icon: '👥', roles: ['adm_geral', 'master_admin'] },
  { label: 'Financeiro', href: '/financeiro', icon: '💰', roles: ['adm_geral', 'master_admin'] },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: '⚙️',
    roles: ['adm_geral', 'master_admin'],
    children: [
      { label: 'Aparência', href: '/configuracoes/aparencia' },
      { label: 'Serviços', href: '/configuracoes/servicos' },
      { label: 'Profissionais', href: '/configuracoes/profissionais' },
      { label: 'Horários', href: '/configuracoes/horarios' },
    ],
  },
]

export default function AdminSidebar({
  slug,
  tenantName,
  userRole,
}: {
  slug: string
  tenantName: string
  userRole: UserRole
}) {
  const pathname = usePathname()
  const base = `/admin/${slug}`

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <aside className="flex w-56 flex-col border-r bg-white">
      <div className="border-b px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Painel</p>
        <p className="mt-1 truncate font-semibold">{tenantName}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {visibleItems.map((item) => {
          const href = `${base}${item.href}`
          const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)

          return (
            <div key={item.href}>
              <Link
                href={href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 font-medium text-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>

              {/* Sub-itens — exibe quando a seção pai está ativa */}
              {item.children && isActive && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5">
                  {item.children.map((child) => {
                    const childHref = `${base}${child.href}`
                    const childActive = pathname.startsWith(childHref)
                    return (
                      <Link
                        key={child.href}
                        href={childHref}
                        className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                          childActive
                            ? 'font-medium text-black'
                            : 'text-gray-500 hover:text-black'
                        }`}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t p-2">
        <Link
          href={`/${slug}`}
          target="_blank"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-400 hover:text-black"
        >
          ↗ Ver página pública
        </Link>
      </div>
    </aside>
  )
}
