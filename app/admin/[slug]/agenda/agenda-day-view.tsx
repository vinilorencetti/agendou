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
  confirmed:   { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  pending:     { bg: '#fffbeb', border: '#f59e0b', text: '#b45309' },
  in_progress: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  completed:   { bg: '#f9fafb', border: '#9ca3af', text: '#6b7280' },
  cancelled:   { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
  no_show:     { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce' },
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

  return (
    <div>
      {/* Navegação */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate(addDays(date, -1))} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">←</button>
        <div className="flex gap-1 overflow-x-auto">
          {[-2,-1,0,1,2,3,4].map((offset) => {
            const d = addDays(date, offset)
            const isToday = d === today
            const isSel = d === date
            return (
              <button key={d} onClick={() => navigate(d)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isSel ? 'bg-black text-white' : isToday ? 'border border-black/30' : 'text-gray-500 hover:bg-gray-100'}`}>
                {isToday && !isSel ? 'Hoje' : fmtDay(d)}
              </button>
            )
          })}
        </div>
        <button onClick={() => navigate(addDays(date, 1))} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">→</button>
        {date !== today && <button onClick={() => navigate(today)} className="ml-auto rounded-lg border px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">Hoje</button>}

        {/* Ações */}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setShowBlock(true)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            🚫 Bloquear
          </button>
          <button onClick={() => setShowBooking(true)}
            className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">
            + Novo agendamento
          </button>
        </div>
      </div>

      {/* Grade */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <div className="flex min-w-[500px]">
          {/* Horas */}
          <div className="w-14 shrink-0 border-r">
            <div className="h-10 border-b" />
            {hours.map((h) => (
              <div key={h} className="relative flex items-start justify-end pr-2 text-[10px] text-gray-400" style={{ height: PX_PER_HOUR }}>
                <span className="-translate-y-2">{String(h).padStart(2,'0')}:00</span>
              </div>
            ))}
          </div>

          {/* Colunas por profissional */}
          {professionals.map((pro) => {
            const proAppts = appointments.filter((a) => a.professionals?.id === pro.id)
            return (
              <div key={pro.id} className="flex-1 border-r last:border-r-0 min-w-[120px]">
                <div className="flex h-10 items-center gap-2 border-b px-3">
                  {pro.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={pro.avatar_url} alt={pro.name} className="h-6 w-6 rounded-full object-cover" />
                    : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold">{pro.name[0]}</div>
                  }
                  <span className="truncate text-xs font-medium">{pro.name}</span>
                </div>

                <div className="relative" style={{ height: (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR }}>
                  {hours.map((h) => (
                    <div key={h} className="absolute w-full border-t border-gray-100" style={{ top: (h - DAY_START_HOUR) * PX_PER_HOUR }} />
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
                      <div key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md border-l-2 px-2 py-1 text-[11px] leading-tight hover:brightness-95 transition-all"
                        style={{ top, height, backgroundColor: c.bg, borderColor: c.border, color: c.text }}>
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
            <div className="flex flex-1 items-center justify-center py-20 text-sm text-gray-400">
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
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
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
      <div className="h-2 w-2 rounded-full bg-red-500" />
      <div className="h-px flex-1 bg-red-400" />
    </div>
  )
}
