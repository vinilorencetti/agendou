'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import { saveBusinessHours } from '@/app/actions/settings'
import type { DayOfWeek, Database } from '@/types/database'

type BusinessHour = Database['public']['Tables']['tenant_business_hours']['Row']

const DAY_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo',
}

type DayState = { isOpen: boolean; openTime: string; closeTime: string }

function buildState(hours: BusinessHour[]): Record<DayOfWeek, DayState> {
  const result = {} as Record<DayOfWeek, DayState>
  for (const day of DAY_ORDER) {
    const h = hours.find((x) => x.day === day)
    result[day] = h
      ? { isOpen: h.is_open, openTime: h.open_time, closeTime: h.close_time }
      : { isOpen: false, openTime: '09:00', closeTime: '18:00' }
  }
  return result
}

export default function BusinessHoursEditor({
  tenantId,
  slug,
  initialHours,
}: {
  tenantId: string
  slug: string
  initialHours: BusinessHour[]
}) {
  const [days, setDays] = useState(() => buildState(initialHours))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setDay(day: DayOfWeek, patch: Partial<DayState>) {
    setDays((d) => ({ ...d, [day]: { ...d[day], ...patch } }))
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const result = await saveBusinessHours(
      tenantId,
      slug,
      DAY_ORDER.map((day) => ({ day, ...days[day] }))
    )

    if (!result.success) setError(result.error ?? 'Erro ao salvar.')
    else setSaved(true)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {DAY_ORDER.map((day) => {
        const d = days[day]
        return (
          <div key={day} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDay(day, { isOpen: !d.isOpen })}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${d.isOpen ? 'bg-black' : 'bg-gray-200'}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${d.isOpen ? 'left-[18px]' : 'left-0.5'}`}
              />
            </button>

            <span className={`w-32 text-sm ${d.isOpen ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {DAY_LABELS[day]}
            </span>

            {d.isOpen ? (
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={d.openTime}
                  onChange={(e) => setDay(day, { openTime: e.target.value })}
                  className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black"
                />
                <span className="text-gray-400">às</span>
                <input
                  type="time"
                  value={d.closeTime}
                  onChange={(e) => setDay(day, { closeTime: e.target.value })}
                  className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400">Fechado</span>
            )}
          </div>
        )
      })}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} loading={loading}>
          Salvar horários
        </Button>
        {saved && <span className="text-sm text-green-600">✓ Salvo</span>}
      </div>
    </div>
  )
}
