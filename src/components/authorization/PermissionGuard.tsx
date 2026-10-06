import type { ReactNode } from 'react'
import type { Permission } from '@/auth/permissions'
import { useAuthorization } from '@/auth/useAuthorization'

interface PermissionGuardProps {
  /** One permission, or several (see `mode`). */
  permission: Permission | readonly Permission[]
  /** With several permissions: "any" (default) needs one of them, "all" needs every one. */
  mode?: 'any' | 'all'
  /** Shown when access is missing. Defaults to nothing. */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Shows its children only to people who hold the permission. This improves the UI; it does NOT secure data, which the
 * backend must protect on every request.
 */
export function PermissionGuard({ permission, mode = 'any', fallback = null, children }: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthorization()
  const list = typeof permission === 'string' ? [permission] : permission
  const allowed = list.length === 1 ? hasPermission(list[0]) : mode === 'all' ? hasAllPermissions(list) : hasAnyPermission(list)
  return <>{allowed ? children : fallback}</>
}
