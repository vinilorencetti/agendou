import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }

const styles: Record<Variant, string> = {
  primary:   'text-white disabled:opacity-50 shadow-lg shadow-violet-900/30',
  secondary: 'border text-agendou-text hover:bg-white/10 disabled:opacity-50',
  ghost:     'text-agendou-muted hover:bg-white/10 hover:text-agendou-text disabled:opacity-50',
  danger:    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
}

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', loading, children, className = '', disabled, style, ...props }, ref) => {
    const isPrimary = variant === 'primary'
    const isSecondary = variant === 'secondary'

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${styles[variant]} ${className}`}
        style={{
          ...(isPrimary ? { background: 'var(--agendou-gradient)' } : {}),
          ...(isSecondary ? { borderColor: 'var(--agendou-border)', backgroundColor: 'var(--agendou-surface-2)' } : {}),
          ...style,
        }}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
