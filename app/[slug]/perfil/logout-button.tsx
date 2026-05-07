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
      className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-white p-4 shadow-sm transition-colors hover:bg-red-50"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">🚪</span>
        <span className="font-medium text-red-500">Sair da conta</span>
      </div>
      <span className="text-red-300">›</span>
    </button>
  )
}
