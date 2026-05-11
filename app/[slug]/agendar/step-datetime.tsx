'use client'

import { useState, useEffect } from 'react'
import { getUpcomingDates, formatDateLabel, TIMEZONE } from '@/lib/availability'
import type { TimeSlot } from '@/lib/availability'
import type { Database } from '@/types/database'

type Professional = Database['public']['Tables']['professionals']['Row'] & {
  professional_schedules: Database['public']['Tables']['professional_schedules']['Row'][]
}
type Service = Database['public']['Tables']['services']['Row']

type SlotState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error'

export default function StepDatetime({
  professional,
  service,
  selectedDate,
  selectedSlot,
  onSelect,
  onBack,
}: {
  professional: Professional
  service: Service
  selectedDate: string
  selectedSlot: TimeSlot | null
  onSelect: (date: string, slot: TimeSlot) => void
  onBack: () => void
}) {
  const dates = getUpcomingDates(30)
  const [date, setDate] = useState(selectedDate || dates[0])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotState, setSlotState] = useState<SlotState>('idle')
  const [pickedSlot, setPickedSlot] = useState<TimeSlot | null>(selectedSlot)

  useEffect(() => {
    if (!date) return
    setSlotState('loading')
    setPickedSlot(null)

    const params = new URLSearchParams({
      professional_id: professional.id,
      service_id: service.id,
      date,
    })

    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then(({ slots: data }: { slots: TimeSlot[] }) => {
        setSlots(data)
        setSlotState(data.length > 0 ? 'loaded' : 'empty')
      })
      .catch(() => setSlotState('error'))
  }, [date, professional.id, service.id])

  // Agrupa slots por período
  function groupSlots(slots: TimeSlot[]) {
    const morning: TimeSlot[] = []
    const afternoon: TimeSlot[] = []
    const evening: TimeSlot[] = []

    for (const slot of slots) {
      const hour = new Date(slot.startUtc).toLocaleString('pt-BR', {
        hour: 'numeric',
        hour12: false,
        timeZone: TIMEZONE,
      })
      const h = parseInt(hour)
      if (h < 12) morning.push(slot)
      else if (h < 18) afternoon.push(slot)
      else evening.push(slot)
    }
    return { morning, afternoon, evening }
  }

  const groups = groupSlots(slots)

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm opacity-50 hover:opacity-100">←</button>
        <div>
          <h2 className="text-lg font-semibold">Quando você quer ir?</h2>
          <p className="text-xs opacity-50">{service.name} · {professional.name}</p>
        </div>
      </div>

      {/* Seletor de data — scroll horizontal */}
      <div className="mb-6 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dates.map((d) => {
            const [year, month, day] = d.split('-').map(Number)
            const dt = new Date(Date.UTC(year, month - 1, day, 12))
            const dayNum = dt.toLocaleDateString('pt-BR', { day: 'numeric', timeZone: TIMEZONE })
            const weekDay = dt.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: TIMEZONE }).replace('.', '')
            const isToday = d === dates[0]
            const isSelected = d === date

            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                className="flex shrink-0 flex-col items-center rounded-xl px-3 py-2 transition-all"
                style={isSelected
                  ? { backgroundColor: 'var(--color-brand)', color: '#fff' }
                  : { backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }
                }
              >
                <span className="text-[10px] font-medium uppercase opacity-70">
                  {isToday ? 'Hoje' : weekDay}
                </span>
                <span className="text-lg font-bold leading-none">{dayNum}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="mb-3 text-sm font-medium opacity-60">{formatDateLabel(date)}</p>

      {/* Slots */}
      {slotState === 'loading' && (
        <div className="flex h-24 items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--agendou-border)', borderTopColor: 'var(--color-brand)' }} />
        </div>
      )}

      {slotState === 'empty' && (
        <p className="py-6 text-center text-sm opacity-50">
          Nenhum horário disponível nesta data. Tente outro dia.
        </p>
      )}

      {slotState === 'error' && (
        <p className="py-6 text-center text-sm text-red-500">
          Erro ao carregar horários. Tente novamente.
        </p>
      )}

      {slotState === 'loaded' && (
        <div className="flex flex-col gap-5">
          {(
            [
              { label: '🌅 Manhã', slots: groups.morning },
              { label: '☀️ Tarde', slots: groups.afternoon },
              { label: '🌙 Noite', slots: groups.evening },
            ] as const
          )
            .filter((g) => g.slots.length > 0)
            .map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-50">
                  {group.label}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {group.slots.map((slot) => {
                    const isSelected = pickedSlot?.startUtc === slot.startUtc
                    return (
                      <button
                        key={slot.startUtc}
                        onClick={() => setPickedSlot(slot)}
                        className="rounded-lg py-2 text-sm font-semibold transition-all"
                        style={isSelected
                          ? { backgroundColor: 'var(--color-brand)', borderColor: 'var(--color-brand)', border: '2px solid var(--color-brand)', color: '#fff' }
                          : { backgroundColor: 'var(--agendou-surface)', border: '2px solid var(--agendou-border)', color: 'var(--agendou-text)' }
                        }
                      >
                        {slot.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Confirmar data/hora */}
      {pickedSlot && (
        <div className="mt-6">
          <button
            onClick={() => onSelect(date, pickedSlot)}
            className="w-full rounded-xl py-4 text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-brand-foreground)' }}
          >
            Continuar com {pickedSlot.label} →
          </button>
        </div>
      )}
    </div>
  )
}
