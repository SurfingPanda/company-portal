import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultPortalPreferences } from '@/data/defaultPortalPreferences'
import { loadPreferences, savePreferences } from '@/lib/portalPreferences'
import type { PortalPreferences } from '@/types/portalPreferences'

interface PortalPreferencesContextValue {
  preferences: PortalPreferences
  defaults: PortalPreferences
  /** Applies a change and saves it immediately. */
  update: (updater: (current: PortalPreferences) => PortalPreferences) => void
  /** Restores `defaultPortalPreferences`. Does not touch the profile, requests or notifications. */
  reset: () => void
  /** False when the browser blocks localStorage; preferences then last only for this page session. */
  persisted: boolean
  /** Changes whenever preferences change, so the UI can show a brief "Preferences updated." note. */
  revision: number
  /** Replaces preferences with a copy loaded from the server. Saved locally but does not count as a user change. */
  replace: (next: PortalPreferences) => void
}

const PortalPreferencesContext = createContext<PortalPreferencesContextValue | null>(null)

/** Applies preferences to the document root: theme, reduced motion, text size and contrast. */
function applyToDocument(p: PortalPreferences, systemDark: boolean) {
  const root = document.documentElement
  root.classList.toggle('dark', p.appearance.theme === 'dark' || (p.appearance.theme === 'system' && systemDark))
  root.classList.toggle('reduce-motion', p.accessibility.reduceMotion)
  root.classList.toggle('text-large', p.accessibility.textSize === 'large')
  root.classList.toggle('high-contrast', p.accessibility.highContrast)
}

/**
 * The single source of portal preferences. Persists to localStorage (key `eljin-portal-preferences`) today; a Laravel
 * `GET/PUT /api/account/preferences` can replace the storage calls later. Never stores credentials or personal data.
 */
export function PortalPreferencesProvider({ children }: { children: ReactNode }) {
  const [state] = useState(loadPreferences)
  const [preferences, setPreferences] = useState<PortalPreferences>(state.preferences)
  const [persisted, setPersisted] = useState(state.storageAvailable)
  const [revision, setRevision] = useState(0)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Follow the operating system when the theme is "System".
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    applyToDocument(preferences, systemDark)
  }, [preferences, systemDark])

  const commit = useCallback((next: PortalPreferences) => {
    setPreferences(next)
    setPersisted(savePreferences(next))
    setRevision((r) => r + 1)
  }, [])

  const update = useCallback(
    (updater: (current: PortalPreferences) => PortalPreferences) => {
      commit(updater(preferences))
    },
    [commit, preferences],
  )

  const reset = useCallback(() => commit(structuredClone(defaultPortalPreferences)), [commit])

  const replace = useCallback((next: PortalPreferences) => {
    setPreferences(next)
    setPersisted(savePreferences(next))
  }, [])

  const value = useMemo<PortalPreferencesContextValue>(
    () => ({ preferences, defaults: defaultPortalPreferences, update, reset, persisted, revision, replace }),
    [preferences, update, reset, persisted, revision, replace],
  )

  return <PortalPreferencesContext.Provider value={value}>{children}</PortalPreferencesContext.Provider>
}

export function usePortalPreferences() {
  const context = useContext(PortalPreferencesContext)
  if (!context) throw new Error('usePortalPreferences must be used inside <PortalPreferencesProvider>')
  return context
}
