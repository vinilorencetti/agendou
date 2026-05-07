import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Agendou — Gestão para seu negócio',
    template: '%s | Agendou',
  },
  description: 'Sistema completo de agendamento, financeiro e equipe para pequenos negócios.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://agendou.com.br'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
