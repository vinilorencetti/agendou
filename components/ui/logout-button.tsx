'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton({
  redirectTo = '/',
  className,
  style,
  children,
}: {
  redirectTo?: string
  className?: string
  style?: React.CSSProperties
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
    <button onClick={handleLogout} className={className} style={style}>
      {children ?? 'Sair'}
    </button>
  )
}
