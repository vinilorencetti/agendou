import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/queries/tenants'

// Injeta as CSS variables do tema do tenant
export default async function PublicTenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) notFound()

  // Calcula cor de texto contrastante para brand
  const hex = tenant.primary_color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const brandForeground = luminance > 0.5 ? '#111111' : '#ffffff'

  return (
    <div
      style={
        {
          '--color-brand': tenant.primary_color,
          '--color-brand-secondary': (tenant as typeof tenant & { secondary_color: string }).secondary_color ?? '#6b7280',
          '--color-brand-foreground': brandForeground,
          backgroundColor: tenant.background_color,
        } as React.CSSProperties
      }
      className="min-h-screen"
    >
      {children}
    </div>
  )
}
