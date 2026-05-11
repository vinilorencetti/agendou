'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  exactMatch?: boolean
}

export default function BottomNav({ slug }: { slug: string }) {
  const pathname = usePathname()

  const items: NavItem[] = [
    {
      href: `/${slug}`,
      label: 'Início',
      exactMatch: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: `/${slug}/agendar`,
      label: 'Agendar',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
          <path strokeLinecap="round" d="M12 14v4M10 16h4" />
        </svg>
      ),
    },
    {
      href: `/${slug}/perfil`,
      label: 'Perfil',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <circle cx="12" cy="8" r="4" />
          <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{ backgroundColor: 'var(--agendou-surface)', borderTop: '1px solid var(--agendou-border)' }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = item.exactMatch
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs font-medium transition-all"
              style={{
                color: isActive ? 'var(--color-brand)' : 'var(--agendou-text-faint)',
              }}
            >
              <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
