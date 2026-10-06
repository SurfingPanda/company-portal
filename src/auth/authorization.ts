import { isUserRole, type UserRole } from '@/auth/roles'
import { permissionsForRoles, type Permission } from '@/auth/permissions'
import type { AuthenticatedUser } from '@/types/user'

/** Pure authorization helpers (no React). The `useAuthorization()` hook wraps these. */

export interface AuthorizationInfo {
  roles: UserRole[]
  permissions: ReadonlySet<Permission>
}

const none: AuthorizationInfo = { roles: [], permissions: new Set() }

/**
 * Works out a user's roles and effective permissions.
 *  - Roles: only known role names are kept.
 *  - Permissions: if the backend sent an explicit list (`user.permissions`) that list is used as-is. Otherwise they are
 *    derived from the roles through the central mapping (development/mock, or an older backend).
 */
export function resolveAuthorization(user: AuthenticatedUser | null): AuthorizationInfo {
  if (!user) return none
  const roles = (user.roles ?? []).filter(isUserRole)
  const permissions = user.permissions && user.permissions.length > 0 ? user.permissions : permissionsForRoles(roles)
  return { roles, permissions: new Set(permissions) }
}
