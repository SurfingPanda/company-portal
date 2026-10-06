import { useMemo } from 'react'
import { useAuthorization } from '@/auth/useAuthorization'
import { navigationItems } from '@/data/navigation'

/** The primary navigation filtered by permission. One navigation system serves every role; items carry their own requirement. */
export function useNavigationItems() {
  const { hasPermission, hasAnyPermission } = useAuthorization()
  return useMemo(
    () => navigationItems.filter((item) => (!item.permission || hasPermission(item.permission)) && (!item.anyPermission || hasAnyPermission(item.anyPermission))),
    [hasPermission, hasAnyPermission],
  )
}
