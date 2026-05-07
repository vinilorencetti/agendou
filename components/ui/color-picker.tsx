'use client'

import { useRef } from 'react'

type Props = {
  label: string
  value: string
  onChange: (color: string) => void
  hint?: string
}

export default function ColorPicker({ label, value, onChange, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-gray-300 px-3 py-2 hover:border-gray-400"
        onClick={() => inputRef.current?.click()}
      >
        {/* Amostra de cor */}
        <span
          className="h-6 w-6 shrink-0 rounded border border-gray-200"
          style={{ backgroundColor: value }}
        />
        {/* Valor hex */}
        <span className="flex-1 font-mono text-sm">{value.toUpperCase()}</span>
        {/* Editar */}
        <span className="text-xs text-gray-400">Alterar</span>
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  )
}
