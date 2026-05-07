// =============================================================================
// Algoritmo de disponibilidade de horários
//
// Todas as datas/horas são manipuladas em UTC internamente.
// Os horários de trabalho (professional_schedules) são armazenados sem
// timezone e interpretados como horário local de Brasília (UTC-3).
// =============================================================================

export const TIMEZONE = 'America/Sao_Paulo'
const UTC_OFFSET_MINUTES = -180 // UTC-3, fixo desde 2019 (sem horário de verão)

export type TimeSlot = {
  startUtc: string  // ISO 8601 UTC — vai para o banco
  endUtc: string
  label: string     // "09:00" exibido para o usuário
}

type Appointment = {
  starts_at: string  // ISO UTC do banco
  ends_at: string
  status: string
}

type BlockedTime = {
  start_at: string
  end_at: string
}

export type Schedule = {
  is_working: boolean
  start_time: string           // "09:00:00"
  end_time: string
  break_start_time?: string | null
  break_end_time?: string | null
}

type Params = {
  date: string              // "2026-05-10" — data local Brasília
  schedule: Schedule | null
  appointments: Appointment[]
  blockedTimes: BlockedTime[]
  durationMin: number
  slotStepMin?: number      // intervalo entre slots (padrão 15 min)
}

// Converte "2026-05-10" + "09:00:00" (horário local Brasília) → Date UTC
function localToDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - UTC_OFFSET_MINUTES * 60_000)
}

// Converte Date UTC → label de horário em Brasília ("09:00")
export function dateToLabel(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

// Formata data para exibição ("seg, 10 de mai.")
export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day, 12))
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: TIMEZONE,
  })
}

// Retorna true se dois intervalos se sobrepõem (exclusivo nas bordas)
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart
}

// Gera todos os slots disponíveis para um dia
export function generateSlots({
  date,
  schedule,
  appointments,
  blockedTimes,
  durationMin,
  slotStepMin = 15,
}: Params): TimeSlot[] {
  if (!schedule || !schedule.is_working) return []

  const workStart = localToDate(date, schedule.start_time)
  const workEnd   = localToDate(date, schedule.end_time)

  // Intervalo configurado (almoço, pausa, etc.)
  const breakStart = schedule.break_start_time ? localToDate(date, schedule.break_start_time) : null
  const breakEnd   = schedule.break_end_time   ? localToDate(date, schedule.break_end_time)   : null

  const now = new Date()
  const slots: TimeSlot[] = []
  let cursor = new Date(workStart)

  while (true) {
    const slotEnd = new Date(cursor.getTime() + durationMin * 60_000)

    if (slotEnd > workEnd) break

    // Slot no passado
    if (slotEnd <= now) {
      cursor = new Date(cursor.getTime() + slotStepMin * 60_000)
      continue
    }

    const blockedByAppointment = appointments
      .filter((a) => a.status !== 'cancelled' && a.status !== 'no_show')
      .some((a) => overlaps(cursor, slotEnd, new Date(a.starts_at), new Date(a.ends_at)))

    const blockedByManual = blockedTimes.some((b) =>
      overlaps(cursor, slotEnd, new Date(b.start_at), new Date(b.end_at))
    )

    // Intervalo do profissional
    const blockedByBreak =
      breakStart && breakEnd
        ? overlaps(cursor, slotEnd, breakStart, breakEnd)
        : false

    if (!blockedByAppointment && !blockedByManual && !blockedByBreak) {
      slots.push({
        startUtc: cursor.toISOString(),
        endUtc:   slotEnd.toISOString(),
        label:    dateToLabel(cursor),
      })
    }

    cursor = new Date(cursor.getTime() + slotStepMin * 60_000)
  }

  return slots
}

// Retorna o dia da semana em inglês para um dateStr local Brasília
export function getDayOfWeek(dateStr: string): import('@/types/database').DayOfWeek {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day, 12))
  return d.toLocaleDateString('en-US', { weekday: 'long', timeZone: TIMEZONE }).toLowerCase() as import('@/types/database').DayOfWeek
}

// Gera um array de datas (YYYY-MM-DD) para os próximos N dias a partir de hoje
export function getUpcomingDates(days = 30): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() + i)
    result.push(d.toISOString().split('T')[0])
  }
  return result
}

// Verifica se um agendamento ainda pode ser cancelado pelo cliente
export function canClientCancel(startsAt: string, policyHours: number): boolean {
  const deadline = new Date(startsAt).getTime() - policyHours * 60 * 60 * 1000
  return Date.now() < deadline
}

// Retorna quanto tempo falta para o deadline de cancelamento (texto)
export function cancelDeadlineLabel(startsAt: string, policyHours: number): string {
  const deadline = new Date(new Date(startsAt).getTime() - policyHours * 60 * 60 * 1000)
  return deadline.toLocaleString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: TIMEZONE,
  })
}
