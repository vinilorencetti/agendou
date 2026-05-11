'use client'

import { useState } from 'react'
import Modal from '@/components/ui/modal'
import Button from '@/components/ui/button'
import { createProfessionalAccount } from '@/app/actions/professionals'

type Props = {
  open: boolean
  onClose: () => void
  professionalId: string
  professionalName: string
  tenantId: string
  onSuccess: () => void
}

export default function CreateAccountModal({
  open,
  onClose,
  professionalId,
  professionalName,
  tenantId,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleClose() {
    setEmail('')
    setPassword('')
    setConfirm('')
    setError(null)
    setDone(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const result = await createProfessionalAccount(professionalId, tenantId, email, password)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Erro desconhecido.')
      return
    }

    setDone(true)
    onSuccess()
  }

  const inputStyle = {
    backgroundColor: 'var(--agendou-surface-2)',
    color: 'var(--agendou-text)',
    border: '1px solid var(--agendou-border)',
  }

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = 'var(--agendou-border)'
      e.currentTarget.style.boxShadow = ''
    },
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={done ? 'Acesso criado!' : `Criar acesso — ${professionalName}`}
    >
      {done ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {/* Ícone de sucesso */}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ background: 'var(--agendou-gradient)' }}
          >
            ✓
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--agendou-text)' }}>
              Conta criada com sucesso!
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
              <strong style={{ color: 'var(--agendou-text)' }}>{professionalName}</strong> já pode
              acessar o painel com o e-mail informado.
            </p>
          </div>
          <p
            className="w-full rounded-xl px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: 'var(--agendou-surface-2)', border: '1px solid var(--agendou-border)', color: 'var(--agendou-text-muted)' }}
          >
            {email}
          </p>
          <Button onClick={handleClose} className="w-full">
            Fechar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div
            className="rounded-xl p-3 text-sm"
            style={{ backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--agendou-text-muted)' }}
          >
            Crie as credenciais de acesso para{' '}
            <strong style={{ color: 'var(--agendou-text)' }}>{professionalName}</strong>. Ele poderá
            entrar em <span style={{ color: '#A78BFA' }}>agendou.com.br/entrar</span> com esses dados.
          </div>

          {/* E-mail */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="acc-email" className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              E-mail
            </label>
            <input
              id="acc-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="barbeiro@exemplo.com"
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
              style={inputStyle}
              {...focusHandlers}
            />
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="acc-password" className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              Senha
            </label>
            <input
              id="acc-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
              style={inputStyle}
              {...focusHandlers}
            />
          </div>

          {/* Confirmar senha */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="acc-confirm" className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
              Confirmar senha
            </label>
            <input
              id="acc-confirm"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              className="rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40"
              style={inputStyle}
              {...focusHandlers}
            />
          </div>

          {/* Mostrar senha */}
          <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--agendou-text-muted)' }}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 rounded accent-violet-600"
            />
            Mostrar senha
          </label>

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Criar acesso
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
