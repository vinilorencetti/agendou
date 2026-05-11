'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import { saveProfessionalSchedule } from '@/app/actions/professionals'
import type { DayOfWeek, Database } from '@/types/database'

type Schedule = Database['public']['Tables']['professional_schedules']['Row']

const DAY_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
}

type DayState = {
  isWorking: boolean
  startTime: string
  endTime: string
  hasBreak: boolean
  breakStart: string
  breakEnd: string
}

function buildInitialState(schedules: Schedule[]): Record<DayOfWeek, DayState> {
  const defaults: Record<DayOfWeek, DayState> = {} as Record<DayOfWeek, DayState>
  for (const day of DAY_ORDER) {
    const s = schedules.find((x) => x.day === day)
    defaults[day] = s
      ? {
          isWorking: s.is_working,
          startTime: s.start_time,
          endTime: s.end_time,
          hasBreak: !!(s.break_start_time),
          breakStart: s.break_start_time ?? '12:00',
          breakEnd: s.break_end_time ?? '13:00',
        }
      : { isWorking: false, startTime: '09:00', endTime: '18:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' }
  }
  return defaults
}

const timeInputStyle = {
  backgroundColor: 'var(--agendou-surface-2)',
  color: 'var(--agendou-text)',
  border: '1px solid var(--agendou-border)',
}

export default function ScheduleEditor({
  professionalId,
  tenantId,
  initialSchedules,
  onClose,
}: {
  professionalId: string
  tenantId: string
  initialSchedules: Schedule[]
  onClose: () => void
}) {
  const [days, setDays] = useState(() => buildInitialState(initialSchedules))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setDay(day: DayOfWeek, patch: Partial<DayState>) {
    setDays((d) => ({ ...d, [day]: { ...d[day], ...patch } }))
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const schedules = DAY_ORDER.map((day) => ({
      day,
      isWorking: days[day].isWorking,
      startTime: days[day].startTime,
      endTime: days[day].endTime,
      breakStartTime: days[day].hasBreak ? days[day].breakStart : null,
      breakEndTime: days[day].hasBreak ? days[day].breakEnd : null,
    }))

    const result = await saveProfessionalSchedule(professionalId, tenantId, schedules)
    if (!result.success) {
      setError(result.error ?? 'Erro ao salvar.')
      setLoading(false)
      return
    }

    setLoading(false)
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {DAY_ORDER.map((day) => {
          const d = days[day]
          return (
            <div key={day} className="rounded-xl p-3" style={{ backgroundColor: 'var(--agendou-surface-2)', border: '1px solid var(--agendou-border)' }}>
              <div className="flex items-center gap-3">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setDay(day, { isWorking: !d.isWorking })}
                  className="relative h-5 w-9 shrink-0 rounded-full transition-all"
                  style={{ background: d.isWorking ? 'var(--agendou-gradient)' : 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                    style={{ left: d.isWorking ? '18px' : '2px' }}
                  />
                </button>

                {/* Dia */}
                <span
                  className="w-20 text-sm"
                  style={{ color: d.isWorking ? 'var(--agendou-text)' : 'var(--agendou-text-faint)', fontWeight: d.isWorking ? 500 : 400 }}
                >
                  {DAY_LABELS[day]}
                </span>

                {/* Horários */}
                {d.isWorking ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={d.startTime}
                      onChange={(e) => setDay(day, { startTime: e.target.value })}
                      className="rounded-lg px-2 py-1 text-sm outline-none"
                      style={timeInputStyle}
                    />
                    <span style={{ color: 'var(--agendou-text-faint)' }}>às</span>
                    <input
                      type="time"
                      value={d.endTime}
                      onChange={(e) => setDay(day, { endTime: e.target.value })}
                      className="rounded-lg px-2 py-1 text-sm outline-none"
                      style={timeInputStyle}
                    />
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--agendou-text-faint)' }}>Folga</span>
                )}
              </div>

              {/* Intervalo */}
              {d.isWorking && (
                <div className="ml-12 mt-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={d.hasBreak}
                      onChange={(e) => setDay(day, { hasBreak: e.target.checked })}
                      className="rounded"
                    />
                    Tem intervalo (almoço, pausa)
                  </label>
                  {d.hasBreak && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>Das</span>
                      <input
                        type="time"
                        value={d.breakStart}
                        onChange={(e) => setDay(day, { breakStart: e.target.value })}
                        className="rounded-lg px-2 py-1 text-sm outline-none"
                        style={timeInputStyle}
                      />
                      <span className="text-xs" style={{ color: 'var(--agendou-text-faint)' }}>às</span>
                      <input
                        type="time"
                        value={d.breakEnd}
                        onChange={(e) => setDay(day, { breakEnd: e.target.value })}
                        className="rounded-lg px-2 py-1 text-sm outline-none"
                        style={timeInputStyle}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} loading={loading}>
          Salvar horários
        </Button>
      </div>
    </div>
  )
}
