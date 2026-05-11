'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/ui/logout-button'
import type { UserRole } from '@/types/database'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  roles?: UserRole[]
  children?: { label: string; href: string }[]
}

function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
      <rect x="3" y="4" width="14" height="14" rx="2" />
      <path strokeLinecap="round" d="M7 2v3M13 2v3M3 8h14" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
      <circle cx="8" cy="7" r="3" />
      <path strokeLinecap="round" d="M2 17c0-3.3 2.7-6 6-6m4-4a3 3 0 1 1 0-6m4 16c0-3.3-2-5.5-4-6.3" />
    </svg>
  )
}
function IconWallet() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
      <path strokeLinecap="round" d="M3 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
      <circle cx="14" cy="10" r="1.25" fill="currentColor" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
      <circle cx="10" cy="10" r="2.5" />
      <path strokeLinecap="round" d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06m9.44 9.44 1.06 1.06M4.22 15.78l1.06-1.06m9.44-9.44 1.06-1.06" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
      <circle cx="10" cy="7" r="3.5" />
      <path strokeLinecap="round" d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  )
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '', icon: <IconGrid /> },
  { label: 'Agenda', href: '/agenda', icon: <IconCalendar /> },
  { label: 'Meu perfil', href: '/meu-perfil', icon: <IconUser />, roles: ['adm_basico'] },
  { label: 'Clientes', href: '/clientes', icon: <IconUsers />, roles: ['adm_geral', 'master_admin'] },
  { label: 'Financeiro', href: '/financeiro', icon: <IconWallet />, roles: ['adm_geral', 'master_admin'] },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: <IconSettings />,
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
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid var(--agendou-border)' }}>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
          style={{ background: 'var(--agendou-gradient)' }}
        >
          A
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--agendou-text-faint)' }}>Painel</p>
          <p className="truncate text-sm font-semibold leading-tight" style={{ color: 'var(--agendou-text)' }}>{tenantName}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2 overflow-y-auto pt-3">
        {visibleItems.map((item) => {
          const href = `${base}${item.href}`
          const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)

          return (
            <div key={item.href}>
              <Link
                href={href}
                onClick={onNavigate}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                style={isActive
                  ? { background: 'rgba(124,58,237,0.2)', color: '#C4B5FD', boxShadow: 'inset 0 0 0 1px rgba(124,58,237,0.3)' }
                  : { color: 'var(--agendou-text-muted)' }
                }
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '' }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>

              {item.children && isActive && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 pb-1">
                  {item.children.map((child) => {
                    const childHref = `${base}${child.href}`
                    const childActive = pathname.startsWith(childHref)
                    return (
                      <Link
                        key={child.href}
                        href={childHref}
                        onClick={onNavigate}
                        className="rounded-lg px-3 py-1.5 text-xs transition-colors"
                        style={{ color: childActive ? '#C4B5FD' : 'var(--agendou-text-faint)', fontWeight: childActive ? 600 : 400 }}
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

      <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid var(--agendou-border)' }}>
        <Link
          href={`/${slug}`}
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors"
          style={{ color: 'var(--agendou-text-faint)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--agendou-text-muted)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--agendou-text-faint)'; e.currentTarget.style.backgroundColor = '' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
            <path strokeLinecap="round" d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 2h5m0 0v5m0-5L7 9" />
          </svg>
          Ver página pública
        </Link>
        <LogoutButton
          redirectTo="/entrar"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors"
          style={{ color: 'var(--agendou-text-faint)' } as React.CSSProperties}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
            <path strokeLinecap="round" d="M10 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3M7 11l3-3-3-3M10 8H2" />
          </svg>
          Sair da conta
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
      <header
        className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden"
        style={{ backgroundColor: 'var(--agendou-surface)', borderBottom: '1px solid var(--agendou-border)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            A
          </div>
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--agendou-text)' }}>{tenantName}</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="ml-3 flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
          style={{ color: 'var(--agendou-text-muted)', backgroundColor: 'var(--agendou-surface-2)', border: '1px solid var(--agendou-border)' }}
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 flex h-full w-64 flex-col shadow-2xl"
            style={{ backgroundColor: 'var(--agendou-surface)', borderRight: '1px solid var(--agendou-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-3" style={{ borderBottom: '1px solid var(--agendou-border)' }}>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 transition-colors hover:bg-white/10"
                style={{ color: 'var(--agendou-text-muted)' }}
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
      <aside
        className="hidden md:flex w-56 flex-col min-h-screen sticky top-0 h-screen"
        style={{ backgroundColor: 'var(--agendou-surface)', borderRight: '1px solid var(--agendou-border)' }}
      >
        <NavContent slug={slug} tenantName={tenantName} userRole={userRole} />
      </aside>
    </>
  )
}
