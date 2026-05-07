'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton({
  redirectTo = '/',
  className,
  children,
}: {
  redirectTo?: string
  className?: string
  children?: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className={className}>
      {children ?? 'Sair'}
    </button>
  )
}
