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

const timeInputStyle = {
  backgroundColor: 'var(--agendou-surface-2)',
  color: 'var(--agendou-text)',
  border: '1px solid var(--agendou-border)',
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
            {/* Toggle */}
            <button
              type="button"
              onClick={() => setDay(day, { isOpen: !d.isOpen })}
              className="relative h-5 w-9 shrink-0 rounded-full transition-all"
              style={{ background: d.isOpen ? 'var(--agendou-gradient)' : 'var(--agendou-surface-2)', border: '1px solid var(--agendou-border)' }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                style={{ left: d.isOpen ? '18px' : '2px' }}
              />
            </button>

            <span
              className="w-32 text-sm"
              style={{ color: d.isOpen ? 'var(--agendou-text)' : 'var(--agendou-text-faint)', fontWeight: d.isOpen ? 500 : 400 }}
            >
              {DAY_LABELS[day]}
            </span>

            {d.isOpen ? (
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={d.openTime}
                  onChange={(e) => setDay(day, { openTime: e.target.value })}
                  className="rounded-lg px-2 py-1 text-sm outline-none transition-all"
                  style={timeInputStyle}
                />
                <span style={{ color: 'var(--agendou-text-faint)' }}>às</span>
                <input
                  type="time"
                  value={d.closeTime}
                  onChange={(e) => setDay(day, { closeTime: e.target.value })}
                  className="rounded-lg px-2 py-1 text-sm outline-none transition-all"
                  style={timeInputStyle}
                />
              </div>
            ) : (
              <span className="text-sm" style={{ color: 'var(--agendou-text-faint)' }}>Fechado</span>
            )}
          </div>
        )
      })}

      {error && (
        <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} loading={loading}>Salvar horários</Button>
        {saved && <span className="text-sm" style={{ color: '#4ADE80' }}>✓ Salvo</span>}
      </div>
    </div>
  )
}
