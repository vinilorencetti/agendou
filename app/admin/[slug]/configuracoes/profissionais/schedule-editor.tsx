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
            <div key={day} className="rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setDay(day, { isWorking: !d.isWorking })}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${d.isWorking ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${d.isWorking ? 'left-[18px]' : 'left-0.5'}`}
                  />
                </button>

                {/* Dia */}
                <span className={`w-20 text-sm ${d.isWorking ? 'text-gray-800' : 'text-gray-400'}`}>
                  {DAY_LABELS[day]}
                </span>

                {/* Horários */}
                {d.isWorking ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={d.startTime}
                      onChange={(e) => setDay(day, { startTime: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                    <span className="text-gray-400">às</span>
                    <input
                      type="time"
                      value={d.endTime}
                      onChange={(e) => setDay(day, { endTime: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Folga</span>
                )}
              </div>

              {/* Intervalo */}
              {d.isWorking && (
                <div className="ml-12 mt-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-500">
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
                      <span className="text-xs text-gray-500">Das</span>
                      <input
                        type="time"
                        value={d.breakStart}
                        onChange={(e) => setDay(day, { breakStart: e.target.value })}
                        className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black"
                      />
                      <span className="text-xs text-gray-500">às</span>
                      <input
                        type="time"
                        value={d.breakEnd}
                        onChange={(e) => setDay(day, { breakEnd: e.target.value })}
                        className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

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
