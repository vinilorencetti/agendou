import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/queries/tenants'

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

  const hex = tenant.primary_color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const brandForeground = luminance > 0.5 ? '#111111' : '#ffffff'

  // Cor de fundo padrão — cinza muito claro se não definido
  const bgColor = tenant.background_color || '#f9fafb'

  return (
    <div
      style={
        {
          '--color-brand': tenant.primary_color,
          '--color-brand-secondary': (tenant as typeof tenant & { secondary_color: string }).secondary_color ?? '#6b7280',
          '--color-brand-foreground': brandForeground,
          '--color-brand-rgb': `${r},${g},${b}`,
          backgroundColor: bgColor,
          minHeight: '100dvh',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
