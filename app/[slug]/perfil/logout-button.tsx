'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton({ slug }: { slug: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(`/${slug}`)
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center justify-between rounded-2xl p-4 transition-colors"
      style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid rgba(239,68,68,0.2)' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--agendou-surface)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">🚪</span>
        <span className="font-medium text-red-500">Sair da conta</span>
      </div>
      <span className="text-red-300">›</span>
    </button>
  )
}
