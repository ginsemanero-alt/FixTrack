import type { ReactNode } from 'react'
import { statusStyle, urgencyStyle } from '../lib/utils'
import type { Status, Urgency } from '../types'

export function Badge({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  )
}

export const UrgencyBadge = ({ value }: { value: Urgency }) => (
  <Badge className={urgencyStyle[value]}>{value}</Badge>
)

export const StatusBadge = ({ value }: { value: Status }) => (
  <Badge className={statusStyle[value]}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {value}
  </Badge>
)

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 ${className}`}>
      {children}
    </div>
  )
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'dark' }) {
  const styles = {
    primary: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700',
    dark: 'bg-slate-900 text-white hover:bg-slate-700',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
  }[variant]
  return <button {...props} className={`${btnBase} ${styles} ${className}`} />
}

export const inputClass =
  'w-full rounded-2xl border-0 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-transparent placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs font-medium text-slate-400">{hint}</span>}
    </label>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border-2 border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">
      {children}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2.5rem] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500 hover:bg-slate-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
