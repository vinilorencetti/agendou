import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import AdminSidebar from './admin-sidebar'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/admin/${slug}/entrar`)
  }

  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  // Busca role do usuário neste tenant (ou master_admin global)
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role, tenant_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .in('role', ['adm_geral', 'adm_basico', 'master_admin'])

  const masterRole = roles?.find((r) => r.role === 'master_admin')
  const tenantRole = roles?.find(
    (r) => r.tenant_id === tenant.id && (r.role === 'adm_geral' || r.role === 'adm_basico')
  )

  if (!tenantRole && !masterRole) {
    redirect(`/admin/${slug}/entrar?error=no-access`)
  }

  const userRole = masterRole?.role ?? tenantRole?.role

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--agendou-bg)' }}>
      <AdminSidebar slug={slug} tenantName={tenant.name} userRole={userRole!} />
      <main className="flex-1 p-4 pt-18 md:p-6 md:pt-6" style={{ color: 'var(--agendou-text)' }}>{children}</main>
    </div>
  )
}
