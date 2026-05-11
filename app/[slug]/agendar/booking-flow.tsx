'use client'

import { useState } from 'react'
import StepService from './step-service'
import StepProfessional from './step-professional'
import StepDatetime from './step-datetime'
import StepClientInfo from './step-client-info'
import StepDone from './step-done'
import type { Database } from '@/types/database'
import type { TimeSlot } from '@/lib/availability'

type Service = Database['public']['Tables']['services']['Row']
type Professional = Database['public']['Tables']['professionals']['Row'] & {
  professional_services: { service_id: string }[]
  professional_schedules: Database['public']['Tables']['professional_schedules']['Row'][]
}

export type BookingState = {
  service: Service | null
  professional: Professional | null
  slot: TimeSlot | null
  date: string
}

export type ConfirmedBooking = { [K in keyof BookingState]: NonNullable<BookingState[K]> }

type Step = 'service' | 'professional' | 'datetime' | 'info' | 'done'

const STEPS: Step[] = ['service', 'professional', 'datetime', 'info', 'done']
const STEP_LABELS: Partial<Record<Step, string>> = {
  service: 'Serviço',
  professional: 'Profissional',
  datetime: 'Data e hora',
  info: 'Seus dados',
}

export default function BookingFlow({
  tenantId,
  tenantSlug,
  services,
  professionals,
  userProfile,
}: {
  tenantId: string
  tenantSlug: string
  services: Service[]
  professionals: Professional[]
  userProfile?: { name: string; phone: string; email: string }
}) {
  const [step, setStep] = useState<Step>('service')
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    professional: null,
    slot: null,
    date: '',
  })
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  function update(patch: Partial<BookingState>) {
    setBooking((b) => ({ ...b, ...patch }))
  }

  function goNext() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function goBack() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  // Profissionais que executam o serviço selecionado
  const eligibleProfessionals = booking.service
    ? professionals.filter((p) =>
        p.professional_services.some((ps) => ps.service_id === booking.service!.id)
      )
    : professionals

  const stepIndex = STEPS.indexOf(step)
  const visibleSteps = STEPS.filter((s) => s !== 'done')

  return (
    <div>
      {/* Progress bar — esconde na tela de confirmação */}
      {step !== 'done' && (
        <div className="mb-6">
          <div className="flex items-center gap-1">
            {visibleSteps.map((s, i) => {
              const past = i < stepIndex
              const active = s === step
              return (
                <div key={s} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="h-1 w-full rounded-full transition-all"
                    style={{
                      backgroundColor: past || active ? 'var(--color-brand)' : 'var(--agendou-border)',
                      opacity: active ? 1 : past ? 0.5 : 1,
                    }}
                  />
                  <span
                    className="text-[10px] font-medium transition-colors"
                    style={{ color: active ? 'var(--color-brand)' : past ? 'var(--color-brand-secondary)' : undefined, opacity: !active && !past ? 0.4 : undefined }}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Steps */}
      {step === 'service' && (
        <StepService
          services={services}
          selected={booking.service}
          onSelect={(s) => {
            update({ service: s, professional: null, slot: null, date: '' })
            goNext()
          }}
        />
      )}

      {step === 'professional' && booking.service && (
        <StepProfessional
          professionals={eligibleProfessionals}
          selected={booking.professional}
          service={booking.service}
          onSelect={(p) => {
            update({ professional: p, slot: null, date: '' })
            goNext()
          }}
          onBack={goBack}
        />
      )}

      {step === 'datetime' && booking.service && booking.professional && (
        <StepDatetime
          professional={booking.professional}
          service={booking.service}
          selectedDate={booking.date}
          selectedSlot={booking.slot}
          onSelect={(date, slot) => {
            update({ date, slot })
            goNext()
          }}
          onBack={goBack}
        />
      )}

      {step === 'info' && booking.service && booking.professional && booking.slot && (
        <StepClientInfo
          tenantId={tenantId}
          booking={booking as ConfirmedBooking}
          userProfile={userProfile}
          onConfirmed={(id) => {
            setAppointmentId(id)
            goNext()
          }}
          onBack={goBack}
        />
      )}

      {step === 'done' && booking.service && booking.professional && booking.slot && (
        <StepDone
          booking={booking as ConfirmedBooking}
          tenantSlug={tenantSlug}
          appointmentId={appointmentId!}
        />
      )}
    </div>
  )
}
