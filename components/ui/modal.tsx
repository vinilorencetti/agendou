'use client'

import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) el.showModal()
    else el.close()
  }, [open])

  // Fecha ao clicar no backdrop
  function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect()
    if (!rect) return
    const outside =
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top  || e.clientY > rect.bottom
    if (outside) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      onClose={onClose}
      className="w-full max-w-lg rounded-2xl p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      style={{ backgroundColor: 'var(--agendou-surface)', border: '1px solid var(--agendou-border)', color: 'var(--agendou-text)' }}
    >
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--agendou-border)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--agendou-text)' }}>{title}</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
          style={{ color: 'var(--agendou-text-muted)' }}
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  )
}
