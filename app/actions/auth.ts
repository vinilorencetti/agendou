'use server'

import { createClient } from '@/lib/supabase/server'

export type SignUpResult =
  | { success: true; requiresEmailConfirmation: boolean }
  | { success: false; error: string }

export async function signUp(formData: {
  fullName: string
  email: string
  password: string
}): Promise<SignUpResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: { full_name: formData.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: 'Este e-mail já está cadastrado.' }
    }
    return { success: false, error: 'Erro ao criar conta. Tente novamente.' }
  }

  // Cria o perfil público do usuário
  if (data.user) {
    await supabase.from('users').upsert({
      id: data.user.id,
      full_name: formData.fullName,
    })
  }

  const requiresEmailConfirmation = !data.session

  return { success: true, requiresEmailConfirmation }
}
