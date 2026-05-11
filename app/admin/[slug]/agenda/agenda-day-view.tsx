'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppointmentModal from './appointment-modal'
import ManualBookingModal from './manual-booking-modal'
import BlockTimeModal from './block-time-modal'

const TZ = 'America/Sao_Paulo'
const DAY_START_HOUR = 7
const DAY_END_HOUR = 21
const PX_PER_HOUR = 64

type Appointment = {
  id: string
  starts_at: string
  ends_at: string
  status: string
  notes: string | null
  internal_notes: string | null
  price_snapshot: number
  services: { name: string } | null
  professionals: { id: string; name: string; avatar_url: string | null } | null
  clients: { full_name: string; phone: string | null } | null
}
type Professional = { id: string; name: string; avatar_url: string | null }
type Service = { id: string; name: string; duration_min: number; price: number }

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmed:   { bg: 'rgba(59,130,246,0.18)',  border: '#3b82f6', text: '#60a5fa' },
  pending:     { bg: 'rgba(234,179,8,0.18)',   border: '#d97706', text: '#fbbf24' },
  in_progress: { bg: 'rgba(34,197,94,0.18)',   border: '#16a34a', text: '#4ade80' },
  completed:   { bg: 'rgba(255,255,255,0.06)', border: '#6b7280', text: '#9ca3af' },
  cancelled:   { bg: 'rgba(239,68,68,0.18)',   border: '#ef4444', text: '#f87171' },
  no_show:     { bg: 'rgba(167,139,250,0.18)', border: '#8b5cf6', text: '#c4b5fd' },
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendente', in_progress: 'Em atendimento',
  completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu',
}

function toTopPx(isoDate: string): number {
  const d = new Date(isoDate)
  const h = parseInt(d.toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: TZ }))
  return (h * 60 + d.getMinutes() - DAY_START_HOUR * 60) * (PX_PER_HOUR / 60)
}

function addDays(dateStr: string, n: number) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().split('T')[0]
}
function fmtDay(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ,
  })
}

export default function AgendaDayView({
  date, today, appointments, professionals, services, tenantId, slug,
}: {
  date: string; today: string; appointments: Appointment[]
  professionals: Professional[]; services: Service[]; tenantId: string; slug: string
}) {
  const router = useRouter()
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i)

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [showBlock, setShowBlock] = useState(false)

  function navigate(d: string) { router.push(`/admin/${slug}/agenda?date=${d}`) }
  function refresh() { router.refresh() }

  const navBtnStyle = {
    backgroundColor: 'var(--agendou-surface)',
    border: '1px solid var(--agendou-border)',
    color: 'var(--agendou-text-muted)',
  }

  return (
    <div>
      {/* Navegação */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => navigate(addDays(date, -1))}
          className="rounded-xl px-3 py-1.5 text-sm transition-colors"
          style={navBtnStyle}
        >←</button>

        <div className="flex gap-1 overflow-x-auto">
          {[-2,-1,0,1,2,3,4].map((offset) => {
            const d = addDays(date, offset)
            const isToday = d === today
            const isSel = d === date
            return (
              <button
                key={d}
                onClick={() => navigate(d)}
                className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
                style={isSel
                  ? { background: 'var(--agendou-gradient)', color: '#fff' }
                  : isToday
                  ? { backgroundColor: 'rgba(124,58,237,0.15)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.35)' }
                  : { color: 'var(--agendou-text-muted)' }
                }
              >
                {isToday && !isSel ? 'Hoje' : fmtDay(d)}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => navigate(addDays(date, 1))}
          className="rounded-xl px-3 py-1.5 text-sm transition-colors"
          style={navBtnStyle}
        >→</button>
        {date !== today && (
          <button
            onClick={() => navigate(today)}
            className="ml-auto rounded-xl px-3 py-1.5 text-xs transition-colors"
            style={navBtnStyle}
          >Hoje</button>
        )}

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowBlock(true)}
            className="rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
            style={navBtnStyle}
          >
            🚫 Bloquear
          </button>
          <button
            onClick={() => setShowBooking(true)}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            + Novo agendamento
          </button>
        </div>
      </div>

      {/* Grade */}
      <div
        className="overflow-x-auto rounded-2xl"
        style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
      >
        <div className="flex min-w-[500px]">
          {/* Horas */}
          <div className="w-14 shrink-0" style={{ borderRight: '1px solid var(--agendou-border)' }}>
            <div className="h-10" style={{ borderBottom: '1px solid var(--agendou-border)' }} />
            {hours.map((h) => (
              <div
                key={h}
                className="relative flex items-start justify-end pr-2 text-[10px]"
                style={{ height: PX_PER_HOUR, color: 'var(--agendou-text-faint)' }}
              >
                <span className="-translate-y-2">{String(h).padStart(2,'0')}:00</span>
              </div>
            ))}
          </div>

          {/* Colunas por profissional */}
          {professionals.map((pro) => {
            const proAppts = appointments.filter((a) => a.professionals?.id === pro.id)
            return (
              <div
                key={pro.id}
                className="flex-1 min-w-[120px]"
                style={{ borderRight: '1px solid var(--agendou-border)' }}
              >
                <div className="flex h-10 items-center gap-2 px-3" style={{ borderBottom: '1px solid var(--agendou-border)' }}>
                  {pro.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={pro.avatar_url} alt={pro.name} className="h-6 w-6 rounded-full object-cover" />
                    : (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'var(--agendou-gradient)' }}
                      >
                        {pro.name[0]}
                      </div>
                    )
                  }
                  <span className="truncate text-xs font-medium" style={{ color: 'var(--agendou-text)' }}>{pro.name}</span>
                </div>

                <div className="relative" style={{ height: (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full"
                      style={{ top: (h - DAY_START_HOUR) * PX_PER_HOUR, borderTop: '1px solid var(--agendou-border)' }}
                    />
                  ))}
                  <NowLine />

                  {proAppts.map((appt) => {
                    const startMin = new Date(appt.starts_at).getMinutes() + parseInt(new Date(appt.starts_at).toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: TZ })) * 60
                    const endMin = new Date(appt.ends_at).getMinutes() + parseInt(new Date(appt.ends_at).toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: TZ })) * 60
                    const top = toTopPx(appt.starts_at)
                    const height = Math.max((endMin - startMin) * (PX_PER_HOUR / 60), 24)
                    const c = STATUS_COLORS[appt.status] ?? STATUS_COLORS.confirmed
                    const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                    return (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-lg border-l-2 px-2 py-1 text-[11px] leading-tight transition-all hover:brightness-110"
                        style={{ top, height, backgroundColor: c.bg, borderColor: c.border, color: c.text }}
                      >
                        <p className="font-semibold truncate">{appt.clients?.full_name}</p>
                        {height > 32 && <p className="truncate opacity-75">{appt.services?.name}</p>}
                        {height > 48 && <p className="opacity-60">{fmt.format(appt.price_snapshot)}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {professionals.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-20 text-sm" style={{ color: 'var(--agendou-text-faint)' }}>
              Nenhum profissional cadastrado.
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-3 flex flex-wrap gap-3">
        {Object.entries(STATUS_LABELS).map(([s, label]) => {
          const c = STATUS_COLORS[s]
          return (
            <div key={s} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
              <span className="h-2.5 w-2.5 rounded-sm border-l-2" style={{ backgroundColor: c.bg, borderColor: c.border }} />
              {label}
            </div>
          )
        })}
      </div>

      {/* Modais */}
      <AppointmentModal
        appointment={selectedAppt}
        open={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onUpdated={refresh}
      />
      <ManualBookingModal
        open={showBooking}
        onClose={() => setShowBooking(false)}
        onCreated={refresh}
        tenantId={tenantId}
        professionals={professionals}
        services={services}
        defaultDate={date}
      />
      <BlockTimeModal
        open={showBlock}
        onClose={() => setShowBlock(false)}
        onCreated={refresh}
        professionals={professionals}
        defaultDate={date}
      />
    </div>
  )
}

function NowLine() {
  const now = new Date()
  const h = parseInt(now.toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: TZ }))
  const top = (h * 60 + now.getMinutes() - DAY_START_HOUR * 60) * (PX_PER_HOUR / 60)
  if (h < DAY_START_HOUR || h >= DAY_END_HOUR) return null
  return (
    <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top }}>
      <div className="h-2 w-2 rounded-full bg-violet-400" />
      <div className="h-px flex-1 bg-violet-400 opacity-60" />
    </div>
  )
}
