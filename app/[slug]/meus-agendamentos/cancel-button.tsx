'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelAppointmentAsClient } from '@/app/actions/appointments'

export default function CancelButton({
  appointmentId,
  policyHours,
  deadline,
}: {
  appointmentId: string
  policyHours: number
  deadline: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setLoading(true)
    setError(null)
    const result = await cancelAppointmentAsClient(appointmentId)
    if (!result.success) {
      setError(result.error ?? 'Erro ao cancelar.')
      setLoading(false)
      setConfirming(false)
      return
    }
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
          Tem certeza? O cancelamento é definitivo.
          {policyHours > 0 && (
            <> Prazo: até <strong>{deadline}</strong>.</>
          )}
        </p>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Cancelando...' : 'Sim, cancelar'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg px-3 py-1.5 text-xs transition-colors"
            style={{ border: '1px solid var(--agendou-border)', color: 'var(--agendou-text-muted)' }}
          >
            Não
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:text-red-600"
    >
      Cancelar agendamento
    </button>
  )
}
