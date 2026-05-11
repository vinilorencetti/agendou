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
const STATUS_STYLES: Record<FinancialEntryStatus, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(234,179,8,0.15)',   color: '#FACC15' },
  paid:      { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80' },
  cancelled: { bg: 'rgba(255,255,255,0.06)', color: 'var(--agendou-text-faint)' },
}

const navBtnStyle = {
  backgroundColor: 'var(--agendou-surface)',
  border: '1px solid var(--agendou-border)',
  color: 'var(--agendou-text-muted)',
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
      <a href={`?month=${offset(-1)}`} className="rounded-xl px-3 py-1.5 text-sm transition-colors" style={navBtnStyle}>←</a>
      <span className="min-w-[140px] text-center text-sm font-semibold capitalize" style={{ color: 'var(--agendou-text)' }}>{label}</span>
      <a href={`?month=${offset(1)}`} className="rounded-xl px-3 py-1.5 text-sm transition-colors" style={navBtnStyle}>→</a>
      {current !== currentMonth && (
        <a href="?" className="ml-2 rounded-xl px-3 py-1.5 text-xs transition-colors" style={navBtnStyle}>
          Mês atual
        </a>
      )}
    </div>
  )
}

function SummaryCard({ label, value, sub, valueStyle }: { label: string; value: string; sub?: string; valueStyle?: React.CSSProperties }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
    >
      <p className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>{label}</p>
      <p className="mt-1.5 text-2xl font-bold" style={{ color: 'var(--agendou-text)', ...valueStyle }}>{value}</p>
      {sub && <p className="mt-0.5 text-xs" style={{ color: 'var(--agendou-text-faint)' }}>{sub}</p>}
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

  function filterBtnStyle(active: boolean) {
    return active
      ? { background: 'var(--agendou-gradient)', color: '#fff', border: 'none' }
      : { backgroundColor: 'transparent', border: '1px solid var(--agendou-border)', color: 'var(--agendou-text-muted)' }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <MonthNav current={currentMonth} today={today} />
        <button
          onClick={() => setShowNew(true)}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: 'var(--agendou-gradient)' }}
        >
          + Novo lançamento
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Receita total" value={fmt.format(summary.totalIncome)} valueStyle={{ color: '#4ADE80' }} />
        <SummaryCard label="Despesas" value={fmt.format(summary.totalExpense)} valueStyle={{ color: '#F87171' }} />
        <SummaryCard label="Saldo líquido" value={fmt.format(summary.balance)}
          valueStyle={{ color: summary.balance >= 0 ? 'var(--agendou-text)' : '#F87171' }} />
        <SummaryCard label="A receber" value={fmt.format(summary.pendingIncome)}
          sub="receitas pendentes" valueStyle={{ color: '#FACC15' }} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'income', 'expense'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={filterBtnStyle(filterType === t)}
          >
            {t === 'all' ? 'Tudo' : t === 'income' ? '↑ Receitas' : '↓ Despesas'}
          </button>
        ))}
        <div className="ml-2 flex gap-2">
          {(['all', 'pending', 'paid', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="rounded-full px-3 py-1 text-xs transition-all"
              style={filterBtnStyle(filterStatus === s)}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
            Nenhum lançamento encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ borderBottom: '1px solid var(--agendou-border)', backgroundColor: 'var(--agendou-surface-2)' }}>
                  {['Data','Descrição','Categoria','Profissional','Valor','Status','Ações'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold" style={{ color: 'var(--agendou-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={entry.status === 'cancelled' ? 'opacity-40' : ''}
                    style={i > 0 ? { borderTop: '1px solid var(--agendou-border)' } : {}}
                  >
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: 'var(--agendou-text-muted)' }}>{fmtDate(entry.due_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base" style={{ color: entry.type === 'income' ? '#4ADE80' : '#F87171' }}>
                          {entry.type === 'income' ? '↑' : '↓'}
                        </span>
                        <span className="font-medium" style={{ color: 'var(--agendou-text)' }}>{entry.description}</span>
                        {entry.appointment_id && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px]"
                            style={{ backgroundColor: 'rgba(124,58,237,0.2)', color: '#C4B5FD' }}
                          >agend.</span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--agendou-text-faint)' }}>{entry.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--agendou-text-muted)' }}>{entry.category ?? '—'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--agendou-text-muted)' }}>{entry.professionals?.name ?? '—'}</td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums"
                      style={{ color: entry.type === 'income' ? '#4ADE80' : '#F87171' }}
                    >
                      {entry.type === 'expense' && '-'}{fmt.format(entry.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: STATUS_STYLES[entry.status].bg, color: STATUS_STYLES[entry.status].color }}
                      >
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePaid(entry.id)}
                            disabled={loadingId === entry.id}
                            className="text-xs font-medium disabled:opacity-50"
                            style={{ color: '#4ADE80' }}
                          >
                            Marcar pago
                          </button>
                          <button
                            onClick={() => handleCancel(entry.id)}
                            disabled={loadingId === entry.id}
                            className="text-xs disabled:opacity-50"
                            style={{ color: 'var(--agendou-text-faint)' }}
                          >
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
