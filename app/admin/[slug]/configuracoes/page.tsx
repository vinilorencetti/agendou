import type { Metadata } from 'next'
import Link from 'next/link'
import { getTenantBySlug } from '@/lib/queries/tenants'
import TenantProfileForm from './tenant-profile-form'

export const metadata: Metadata = { title: 'Configurações' }

type Props = { params: Promise<{ slug: string }> }

export default async function ConfiguracoesPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return null

  const sections = [
    { label: 'Aparência', href: 'configuracoes/aparencia', icon: '🎨', desc: 'Logo, cores e identidade visual da página dos seus clientes.' },
    { label: 'Serviços', href: 'configuracoes/servicos', icon: '✂️', desc: 'Gerencie os serviços oferecidos, preços e durações.' },
    { label: 'Profissionais', href: 'configuracoes/profissionais', icon: '👥', desc: 'Cadastre sua equipe, foto e horários de cada profissional.' },
    { label: 'Horários', href: 'configuracoes/horarios', icon: '🕐', desc: 'Defina os dias e horários em que o negócio está aberto.' },
  ]

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold" style={{ color: 'var(--agendou-text)' }}>Configurações</h1>

      {/* Atalhos para sub-seções */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-start gap-3 rounded-2xl p-4 transition-all active:scale-[0.98]"
            style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
          >
            <span className="text-xl">{s.icon}</span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--agendou-text)' }}>{s.label}</p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--agendou-text-muted)' }}>{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Perfil do negócio */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)' }}
      >
        <h2 className="mb-4 font-semibold" style={{ color: 'var(--agendou-text)' }}>Perfil do negócio</h2>
        <TenantProfileForm tenant={tenant} />
      </div>
    </div>
  )
}
