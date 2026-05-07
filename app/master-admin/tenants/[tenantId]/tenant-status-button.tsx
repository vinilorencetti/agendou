'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setTenantStatus } from '@/app/actions/master'
import type { TenantStatus } from '@/types/database'

const ACTIONS: Record<TenantStatus, { label: string; next: TenantStatus; style: string }[]> = {
  active: [
    { label: 'Suspender', next: 'suspended', style: 'border-yellow-600 text-yellow-400 hover:bg-yellow-600/20' },
    { label: 'Cancelar', next: 'cancelled', style: 'border-red-600 text-red-400 hover:bg-red-600/20' },
  ],
  suspended: [
    { label: 'Reativar', next: 'active', style: 'border-green-600 text-green-400 hover:bg-green-600/20' },
    { label: 'Cancelar', next: 'cancelled', style: 'border-red-600 text-red-400 hover:bg-red-600/20' },
  ],
  cancelled: [
    { label: 'Reativar', next: 'active', style: 'border-green-600 text-green-400 hover:bg-green-600/20' },
  ],
}

export default function TenantStatusButton({
  tenantId,
  currentStatus,
}: {
  tenantId: string
  currentStatus: TenantStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<TenantStatus | null>(null)

  const actions = ACTIONS[currentStatus] ?? []
  if (actions.length === 0) return null

  async function handleAction(next: TenantStatus) {
    setLoading(next)
    await setTenantStatus(tenantId, next)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.next}
          onClick={() => handleAction(action.next)}
          disabled={loading !== null}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${action.style}`}
        >
          {loading === action.next ? '...' : action.label}
        </button>
      ))}
    </div>
  )
}
