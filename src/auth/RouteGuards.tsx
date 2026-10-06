import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Permission } from '@/auth/permissions'
import { getRoutePermission } from '@/auth/routePermissions'
import { useAuthorization } from '@/auth/useAuthorization'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { getSafeReturnUrl } from '@/lib/auth'

/** Minimal full-page state shown while the session check runs (or fails). No spinner, no splash. */
export function AuthLoadingScreen({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center" role={error ? 'alert' : 'status'} aria-live="polite">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">ELJIN CORPORATION</p>
      {error ? (
        <>
          <p className="text-sm text-muted-foreground">Unable to connect to the employee portal. Please try again.</p>
          <Button className="mt-3" onClick={onRetry}>
            Try Again
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Loading employee portal...</p>
      )}
    </div>
  )
}

interface ProtectedRouteProps {
  /**
   * Extra permission required by this route element. Usually omitted: the central table in auth/routePermissions.ts
   * already maps each path to its permission, so pages never repeat authorization checks.
   */
  permission?: Permission
}

/**
 * Layout route for everything that needs a signed-in employee, and (where the central table or `permission` says so) a
 * permission. Order of checks: session loading -> signed in? -> permitted? Missing permission sends the person to
 * /unauthorized. This is a UI convenience only: the Laravel backend must enforce access on every API request.
 */
export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, error, retry } = useAuth()
  const { hasPermission } = useAuthorization()
  const location = useLocation()

  if (isLoading) return <AuthLoadingScreen />
  // The server could not be reached: say so instead of misleadingly sending people to the login page.
  if (error && !isAuthenticated) return <AuthLoadingScreen error onRetry={retry} />
  if (!isAuthenticated) {
    const target = `${location.pathname}${location.search}`
    const returnUrl = getSafeReturnUrl(target)
    return <Navigate to={returnUrl === '/' ? '/login' : `/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />
  }

  // A new account finishes the first sign-in setup before anything else (and cannot return to it afterwards).
  const needsOnboarding = user?.onboardingCompleted === false
  if (needsOnboarding && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  if (!needsOnboarding && location.pathname === '/onboarding') return <Navigate to="/" replace />

  // Every entry must be satisfied; an entry may list several permissions of which any one is enough.
  const required = [permission, getRoutePermission(location.pathname)].filter((p): p is Permission | readonly Permission[] => Boolean(p))
  if (required.some((entry) => !(Array.isArray(entry) ? entry.some((p) => hasPermission(p)) : hasPermission(entry as Permission)))) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}

/**
 * Wraps routes that are only for signed-out visitors (the login page). A signed-in employee is sent to the page they
 * were trying to reach (a validated internal path) or to the dashboard.
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoadingScreen />
  if (isAuthenticated) return <Navigate to={getSafeReturnUrl(new URLSearchParams(location.search).get('returnUrl'))} replace />
  return <>{children}</>
}
