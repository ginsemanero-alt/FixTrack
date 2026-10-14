import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import type { Role } from '../types'

/** Route guard: sends roles that are not allowed back to the Dashboard. */
export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { role } = useAuth()
  if (!role || !roles.includes(role)) return <Navigate to="/admin" replace />
  return <>{children}</>
}
