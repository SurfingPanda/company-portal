import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { setForbiddenHandler, setUnauthorizedHandler } from '@/services/api'

/**
 * Connects the API client's auth-related responses to the app. Renders nothing.
 *
 *  - 401 (session ended): clear the stale auth state. `ProtectedRoute` then sends the employee to
 *    /login?returnUrl=<current page>. It fires once per signed-in session, so it cannot loop, and the client never
 *    raises it for /api/auth/* calls (so a failed login or session check does not trigger it).
 *  - 403 (signed in but not allowed): open the Access Restricted page. The employee is NOT signed out.
 */
export function ApiAuthHandlers() {
  const navigate = useNavigate()
  const { isAuthenticated, expireSession } = useAuth()
  const authenticated = useRef(isAuthenticated)
  authenticated.current = isAuthenticated

  useEffect(() => {
    setForbiddenHandler(() => navigate('/unauthorized'))
    setUnauthorizedHandler(() => {
      // Ignore stragglers once the session is already cleared (no repeated redirects).
      if (authenticated.current) expireSession()
    })
    return () => {
      setForbiddenHandler(undefined)
      setUnauthorizedHandler(undefined)
    }
  }, [navigate, expireSession])

  return null
}
