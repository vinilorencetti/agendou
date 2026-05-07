'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import NewEntryModal from './new-entry-modal'
import { markEntryAsPaid, cancelEntry } from '@/app/actions/financial'
import type { FinancialEntryType, FinancialEntryStatus } from '@/types/database'

type Entry = {
  id: string
  type: FinancialEntryType
  status: FinancialEntryStatus
  description: string
  amount: number
  due_date: string
  paid_at: string | null
  category: string | null
  notes: string | null
  appointment_id: string | null
  professional_id: string | null
  professionals: { name: string } | null
}

type Professional = { id: string; name: string }

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABELS: Record<FinancialEntryStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  cancelled: 'Cancelado',
}
const STATUS_COLORS: Record<FinancialEntryStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-400',
}

function MonthNav({ current, today }: { current: string; today: string }) {
  const currentMonth = today.slice(0, 7)
  const [y, m] = current.split('-').map(Number)

  function offset(n: number) {
    const d = new Date(y, m - 1 + n, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const label = new Date(y, m - 1, 15).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="flex items-center gap-2">
      <a href={`?month=${offset(-1)}`}
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">←</a>
      <span className="min-w-[140px] text-center text-sm font-medium capitalize">{label}</span>
      <a href={`?month=${offset(1)}`}
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">→</a>
      {current !== currentMonth && (
        <a href="?" className="ml-2 rounded-lg border px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
          Mês atual
        </a>
      )}
    </div>
  )
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function FinanceiroView({
  entries,
  professionals,
  tenantId,
  currentMonth,
  today,
}: {
  entries: Entry[]
  professionals: Professional[]
  tenantId: string
  currentMonth: string
  today: string
}) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [filterType, setFilterType] = useState<'all' | FinancialEntryType>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | FinancialEntryStatus>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const summary = useMemo(() => {
    const income = entries.filter((e) => e.type === 'income' && e.status !== 'cancelled')
    const expense = entries.filter((e) => e.type === 'expense' && e.status !== 'cancelled')
    const totalIncome = income.reduce((s, e) => s + e.amount, 0)
    const totalExpense = expense.reduce((s, e) => s + e.amount, 0)
    const paidIncome = income.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0)
    const pendingIncome = income.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0)
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, paidIncome, pendingIncome }
  }, [entries])

  const filtered = useMemo(() => entries.filter((e) => {
    if (filterType !== 'all' && e.type !== filterType) return false
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    return true
  }), [entries, filterType, filterStatus])

  async function handlePaid(id: string) {
    setLoadingId(id)
    await markEntryAsPaid(id, tenantId)
    setLoadingId(null)
    router.refresh()
  }

  async function handleCancel(id: string) {
    setLoadingId(id)
    await cancelEntry(id, tenantId)
    setLoadingId(null)
    router.refresh()
  }

  function fmtDate(d: string) {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <MonthNav current={currentMonth} today={today} />
        <button onClick={() => setShowNew(true)}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          + Novo lançamento
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Receita total" value={fmt.format(summary.totalIncome)} color="text-green-600" />
        <SummaryCard label="Despesas" value={fmt.format(summary.totalExpense)} color="text-red-600" />
        <SummaryCard label="Saldo líquido" value={fmt.format(summary.balance)}
          color={summary.balance >= 0 ? 'text-gray-900' : 'text-red-600'} />
        <SummaryCard label="A receber" value={fmt.format(summary.pendingIncome)}
          sub="receitas pendentes" color="text-yellow-600" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'income', 'expense'] as const).map((t) => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filterType === t ? 'border-black bg-black text-white' : 'text-gray-500 hover:border-gray-400'
            }`}>
            {t === 'all' ? 'Tudo' : t === 'income' ? '↑ Receitas' : '↓ Despesas'}
          </button>
        ))}
        <div className="ml-2 flex gap-2">
          {(['all', 'pending', 'paid', 'cancelled'] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filterStatus === s ? 'border-black bg-black text-white' : 'text-gray-500 hover:border-gray-400'
              }`}>
              {s === 'all' ? 'Todos os status' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Nenhum lançamento encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Profissional</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((entry) => (
                  <tr key={entry.id} className={`hover:bg-gray-50 ${entry.status === 'cancelled' ? 'opacity-50' : ''}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{fmtDate(entry.due_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-base ${entry.type === 'income' ? 'text-green-500' : 'text-red-400'}`}>
                          {entry.type === 'income' ? '↑' : '↓'}
                        </span>
                        <span className="font-medium">{entry.description}</span>
                        {entry.appointment_id && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">agend.</span>
                        )}
                      </div>
                      {entry.notes && <p className="mt-0.5 text-xs text-gray-400">{entry.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{entry.category ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.professionals?.name ?? '—'}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${
                      entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.type === 'expense' && '-'}{fmt.format(entry.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePaid(entry.id)}
                            disabled={loadingId === entry.id}
                            className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50">
                            Marcar pago
                          </button>
                          <button
                            onClick={() => handleCancel(entry.id)}
                            disabled={loadingId === entry.id}
                            className="text-xs text-gray-400 hover:underline disabled:opacity-50">
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewEntryModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => router.refresh()}
        tenantId={tenantId}
        professionals={professionals}
        today={today}
      />
    </div>
  )
}
