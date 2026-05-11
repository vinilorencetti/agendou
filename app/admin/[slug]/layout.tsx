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
    redirect(`/entrar?redirect=/admin/${slug}`)
  }

  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  // Verifica se o usuário tem acesso a este tenant
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .in('role', ['adm_geral', 'adm_basico'])
    .single()

  // master_admin tem acesso a tudo
  const { data: masterRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'master_admin')
    .eq('is_active', true)
    .single()

  if (!roleData && !masterRole) {
    redirect('/entrar')
  }

  const userRole = masterRole?.role ?? roleData?.role

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--agendou-bg)' }}>
      <AdminSidebar slug={slug} tenantName={tenant.name} userRole={userRole!} />
      <main className="flex-1 p-4 pt-18 md:p-6 md:pt-6" style={{ color: 'var(--agendou-text)' }}>{children}</main>
    </div>
  )
}
