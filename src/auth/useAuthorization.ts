import { useMemo } from 'react'
import { resolveAuthorization } from '@/auth/authorization'
import type { Permission } from '@/auth/permissions'
import type { UserRole } from '@/auth/roles'
import { useAuth } from '@/context/AuthContext'

/**
 * The one way components ask "may this person see or do X?". Built on the existing `useAuth()` user, so there is no
 * second source of truth. These checks shape the UI only; Laravel must authorize every request.
 */
export function useAuthorization() {
  const { user } = useAuth()
  const { roles, permissions } = useMemo(() => resolveAuthorization(user), [user])

  return useMemo(
    () => ({
      roles,
      permissions,
      hasRole: (role: UserRole) => roles.includes(role),
      hasAnyRole: (wanted: readonly UserRole[]) => wanted.some((r) => roles.includes(r)),
      hasPermission: (permission: Permission) => permissions.has(permission),
      hasAnyPermission: (wanted: readonly Permission[]) => wanted.some((p) => permissions.has(p)),
      hasAllPermissions: (wanted: readonly Permission[]) => wanted.every((p) => permissions.has(p)),
    }),
    [roles, permissions],
  )
}
