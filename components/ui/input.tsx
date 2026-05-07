import { forwardRef } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, id, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <input
      ref={ref}
      id={id}
      className={`rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400 ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))

Input.displayName = 'Input'
export default Input
