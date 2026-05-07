import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/queries/tenants'
import FinanceiroView from './financeiro-view'

export const metadata: Metadata = { title: 'Financeiro' }

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ month?: string }>
}

export default async function FinanceiroPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { month: monthParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?redirect=/admin/${slug}/financeiro`)

  const tenant = await getTenantBySlug(slug)
  if (!tenant) redirect(`/admin/${slug}`)

  // Mês selecionado — padrão: mês atual (YYYY-MM)
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const currentMonth = today.slice(0, 7)
  const month = monthParam ?? currentMonth

  const [year, mon] = month.split('-').map(Number)
  const firstDay = `${month}-01`
  const lastDay = new Date(year, mon, 0).toISOString().split('T')[0]

  const [{ data: entries }, { data: professionals }] = await Promise.all([
    supabase
      .from('financial_entries')
      .select('*, professionals(name)')
      .eq('tenant_id', tenant.id)
      .gte('due_date', firstDay)
      .lte('due_date', lastDay)
      .order('due_date', { ascending: false }),

    supabase
      .from('professionals')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('display_order'),
  ])

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Financeiro</h1>
      <p className="mb-6 text-sm text-gray-500">
        Receitas, despesas e fluxo de caixa do negócio.
      </p>
      <FinanceiroView
        entries={entries ?? []}
        professionals={professionals ?? []}
        tenantId={tenant.id}
        currentMonth={month}
        today={today}
      />
    </div>
  )
}
