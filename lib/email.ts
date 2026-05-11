import { Resend } from 'resend'

// Resend client — retorna null se a chave não estiver configurada (evita quebrar em dev/test)
export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@agendou.com.br'
