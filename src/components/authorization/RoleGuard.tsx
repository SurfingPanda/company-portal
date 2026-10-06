import type { ReactNode } from 'react'
import type { UserRole } from '@/auth/roles'
import { useAuthorization } from '@/auth/useAuthorization'

interface RoleGuardProps {
  roles: readonly UserRole[]
  /** "any" (default): at least one of the roles. "all": every role. */
  mode?: 'any' | 'all'
  fallback?: ReactNode
  children: ReactNode
}

/** Shows its children to people with the given role(s). UI only; the backend remains the authority. */
export function RoleGuard({ roles, mode = 'any', fallback = null, children }: RoleGuardProps) {
  const { hasRole, hasAnyRole } = useAuthorization()
  const allowed = mode === 'all' ? roles.every(hasRole) : hasAnyRole(roles)
  return <>{allowed ? children : fallback}</>
}
