import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from './onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se já tem tenant, vai direto para o painel
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('tenant_id, tenants(slug)')
    .eq('user_id', user!.id)
    .eq('role', 'adm_geral')
    .eq('is_active', true)
    .maybeSingle()

  if (existingRole?.tenant_id) {
    const slug = (existingRole.tenants as { slug: string } | null)?.slug
    if (slug) redirect(`/admin/${slug}`)
  }

  // Passa o nome do usuário para personalizar o wizard
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  return <OnboardingWizard userName={profile?.full_name ?? ''} />
}
