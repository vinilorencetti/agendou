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
    { label: 'Aparência', href: 'configuracoes/aparencia', desc: 'Logo, cores e identidade visual da página dos seus clientes.' },
    { label: 'Serviços', href: 'configuracoes/servicos', desc: 'Gerencie os serviços oferecidos, preços e durações.' },
    { label: 'Profissionais', href: 'configuracoes/profissionais', desc: 'Cadastre sua equipe, foto e horários de cada profissional.' },
    { label: 'Horário de funcionamento', href: 'configuracoes/horarios', desc: 'Defina os dias e horários em que o negócio está aberto.' },
  ]

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Configurações</h1>

      {/* Atalhos para sub-seções */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg border bg-white p-4 hover:border-gray-400 hover:shadow-sm transition-all"
          >
            <p className="font-medium">{s.label}</p>
            <p className="mt-1 text-xs text-gray-500">{s.desc}</p>
          </Link>
        ))}
      </div>

      {/* Perfil do negócio */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Perfil do negócio</h2>
        <TenantProfileForm tenant={tenant} />
      </div>
    </div>
  )
}
