import { forwardRef } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, id, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--agendou-text-muted)' }}>
        {label}
      </label>
    )}
    <input
      ref={ref}
      id={id}
      className={`rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-40 disabled:opacity-40 ${error ? 'ring-1 ring-red-500' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--agendou-surface-2)',
        color: 'var(--agendou-text)',
        border: error ? undefined : '1px solid var(--agendou-border)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--agendou-border-purple)'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? undefined! : 'var(--agendou-border)'
        e.currentTarget.style.boxShadow = ''
        props.onBlur?.(e)
      }}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
))

Input.displayName = 'Input'
export default Input
