import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from './onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  // Busca todas as roles ativas do usuário de uma vez
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role, tenant_id, tenants(slug)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  // adm_geral — vai para o painel do seu negócio
  const geralRole = roles?.find((r) => r.role === 'adm_geral')
  if (geralRole?.tenant_id) {
    const slug = (geralRole.tenants as { slug: string } | null)?.slug
    if (slug) redirect(`/admin/${slug}`)
  }

  // adm_basico — também vai para o painel (não precisa de onboarding)
  const basicRole = roles?.find((r) => r.role === 'adm_basico')
  if (basicRole?.tenant_id) {
    const slug = (basicRole.tenants as { slug: string } | null)?.slug
    if (slug) redirect(`/admin/${slug}`)
  }

  // master_admin
  const masterRole = roles?.find((r) => r.role === 'master_admin')
  if (masterRole) redirect('/master-admin')

  // Sem tenant ainda — mostra o wizard de onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return <OnboardingWizard userName={profile?.full_name ?? ''} />
}
