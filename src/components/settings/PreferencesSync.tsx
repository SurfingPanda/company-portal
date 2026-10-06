import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import { sanitizePreferences } from '@/lib/portalPreferences'
import { fetchPreferences, pushPreferences } from '@/services/preferencesService'

/**
 * Keeps the browser copy of the portal preferences and the Laravel copy (/api/account/preferences) in step. Renders nothing.
 *  - after sign-in, the server copy replaces the local one;
 *  - every later change is pushed to the server.
 * The local copy is the immediate cache and the offline fallback: if the server cannot be reached the change simply stays local.
 * In mock mode both service calls are no-ops. Preferences never contain credentials or personal data.
 */
export function PreferencesSync() {
  const { user } = useAuth()
  const { preferences, revision, replace } = usePortalPreferences()
  const pushedRevision = useRef(0)
  const latest = useRef(preferences)
  latest.current = preferences

  const userId = user?.id ?? null
  useEffect(() => {
    if (userId === null) return
    let cancelled = false
    fetchPreferences().then(
      (server) => {
        if (cancelled || server === null) return
        replace(sanitizePreferences(server))
      },
      () => {
        // Server unreachable: keep working with the local copy.
      },
    )
    return () => {
      cancelled = true
    }
  }, [userId, replace])

  useEffect(() => {
    if (revision === pushedRevision.current) return
    pushedRevision.current = revision
    if (userId === null) return
    pushPreferences(latest.current).catch(() => {
      // Kept locally; it is sent again with the next change.
    })
  }, [revision, userId])

  return null
}
