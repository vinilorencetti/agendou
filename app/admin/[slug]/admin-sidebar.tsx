'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/ui/logout-button'
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

function NavContent({
  slug,
  tenantName,
  userRole,
  onNavigate,
}: {
  slug: string
  tenantName: string
  userRole: UserRole
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const base = `/admin/${slug}`

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <>
      <div className="border-b border-gray-100 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Painel</p>
        <p className="mt-1 truncate font-semibold">{tenantName}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const href = `${base}${item.href}`
          const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)

          return (
            <div key={item.href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 font-medium text-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>

              {item.children && isActive && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5">
                  {item.children.map((child) => {
                    const childHref = `${base}${child.href}`
                    const childActive = pathname.startsWith(childHref)
                    return (
                      <Link
                        key={child.href}
                        href={childHref}
                        onClick={onNavigate}
                        className={`rounded-lg px-3 py-2 text-xs transition-colors ${
                          childActive ? 'font-medium text-black' : 'text-gray-500 hover:text-black'
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

      <div className="border-t border-gray-100 p-2 space-y-1">
        <Link
          href={`/${slug}`}
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-400 hover:text-black transition-colors"
        >
          ↗ Ver página pública
        </Link>
        <LogoutButton
          redirectTo="/entrar"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>⎋</span> Sair da conta
        </LogoutButton>
      </div>
    </>
  )
}

export default function AdminSidebar({
  slug,
  tenantName,
  userRole,
}: {
  slug: string
  tenantName: string
  userRole: UserRole
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{tenantName}</p>
          <p className="text-xs text-gray-400">Painel admin</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="ml-3 flex h-9 w-9 items-center justify-center rounded-lg border text-gray-600"
          aria-label="Abrir menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <NavContent
              slug={slug}
              tenantName={tenantName}
              userRole={userRole}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-white min-h-screen sticky top-0 h-screen">
        <NavContent slug={slug} tenantName={tenantName} userRole={userRole} />
      </aside>
    </>
  )
}
