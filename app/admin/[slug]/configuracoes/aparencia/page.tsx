import type { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/queries/tenants'
import AppearanceEditor from './appearance-editor'

export const metadata: Metadata = { title: 'Aparência' }

type Props = { params: Promise<{ slug: string }> }

export default async function AparenciaPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return null

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--agendou-text)' }}>Aparência</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
        Personalize como seus clientes veem a página do seu negócio.
      </p>
      <AppearanceEditor tenant={tenant} />
    </div>
  )
}
