import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import { getServices } from '@/lib/queries/services'
import MyProfileEditor from './my-profile-editor'

export const metadata: Metadata = { title: 'Meu perfil' }

type Props = { params: Promise<{ slug: string }> }

export default async function MeuPerfilPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?redirect=/admin/${slug}/meu-perfil`)

  const tenant = await getTenantBySlug(slug)
  if (!tenant) redirect(`/admin/${slug}`)

  // Busca o profissional vinculado ao usuário
  const { data: professional } = await supabase
    .from('professionals')
    .select('*, professional_services(service_id), professional_schedules(*)')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .maybeSingle()

  // adm_geral não tem professional vinculado — redireciona para configurações
  if (!professional) {
    redirect(`/admin/${slug}/configuracoes/profissionais`)
  }

  const services = await getServices(tenant.id)

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--agendou-text)' }}>Meu perfil</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
        Suas informações visíveis para os clientes e sua agenda de trabalho.
      </p>
      <MyProfileEditor
        professional={professional}
        services={services}
        tenantId={tenant.id}
        tenantSlug={slug}
      />
    </div>
  )
}
