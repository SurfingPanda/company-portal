import { defaultPortalPreferences, PORTAL_PREFERENCES_STORAGE_KEY } from '@/data/defaultPortalPreferences'
import type { NotificationType } from '@/types/notification'
import type { PortalPreferences } from '@/types/portalPreferences'

const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Turns anything read from storage into valid preferences. Unknown or wrongly-typed values fall back to the defaults, so
 * malformed or tampered data can never crash the portal. Only known keys are kept.
 */
export function sanitizePreferences(raw: unknown): PortalPreferences {
  const d = defaultPortalPreferences
  if (!isObject(raw)) return structuredClone(d)

  const n = isObject(raw.notifications) ? raw.notifications : {}
  const a = isObject(raw.accessibility) ? raw.accessibility : {}
  const ap = isObject(raw.appearance) ? raw.appearance : {}

  return {
    dashboardStartPage: 'dashboard',
    resourceView: raw.resourceView === 'list' || raw.resourceView === 'cards' ? raw.resourceView : d.resourceView,
    rememberSearchHistory: isBool(raw.rememberSearchHistory) ? raw.rememberSearchHistory : d.rememberSearchHistory,
    notifications: {
      announcements: isBool(n.announcements) ? n.announcements : d.notifications.announcements,
      hr: isBool(n.hr) ? n.hr : d.notifications.hr,
      it: isBool(n.it) ? n.it : d.notifications.it,
      requests: isBool(n.requests) ? n.requests : d.notifications.requests,
      events: isBool(n.events) ? n.events : d.notifications.events,
      documents: isBool(n.documents) ? n.documents : d.notifications.documents,
    },
    emailMode: raw.emailMode === 'instant' || raw.emailMode === 'daily' || raw.emailMode === 'off' ? raw.emailMode : d.emailMode,
    accessibility: {
      reduceMotion: isBool(a.reduceMotion) ? a.reduceMotion : d.accessibility.reduceMotion,
      textSize: a.textSize === 'large' || a.textSize === 'default' ? a.textSize : d.accessibility.textSize,
      highContrast: isBool(a.highContrast) ? a.highContrast : d.accessibility.highContrast,
    },
    appearance: {
      theme: ap.theme === 'light' || ap.theme === 'dark' || ap.theme === 'system' ? ap.theme : d.appearance.theme,
    },
  }
}

/** Reads stored preferences. Missing storage, blocked storage or invalid JSON all yield the defaults (and invalid data is discarded). */
export function loadPreferences(): { preferences: PortalPreferences; storageAvailable: boolean } {
  try {
    const stored = window.localStorage.getItem(PORTAL_PREFERENCES_STORAGE_KEY)
    if (stored === null) return { preferences: structuredClone(defaultPortalPreferences), storageAvailable: true }
    try {
      return { preferences: sanitizePreferences(JSON.parse(stored)), storageAvailable: true }
    } catch {
      window.localStorage.removeItem(PORTAL_PREFERENCES_STORAGE_KEY)
      return { preferences: structuredClone(defaultPortalPreferences), storageAvailable: true }
    }
  } catch {
    return { preferences: structuredClone(defaultPortalPreferences), storageAvailable: false }
  }
}

export function savePreferences(preferences: PortalPreferences): boolean {
  try {
    window.localStorage.setItem(PORTAL_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
    return true
  } catch {
    return false
  }
}

/** Which preference switch controls a notification type. "system" notices are always shown. */
export function notificationPreferenceKey(type: NotificationType): keyof PortalPreferences['notifications'] | undefined {
  switch (type) {
    case 'announcement':
      return 'announcements'
    case 'hr':
      return 'hr'
    case 'it':
      return 'it'
    case 'request':
      return 'requests'
    case 'event':
      return 'events'
    case 'document':
      return 'documents'
    default:
      return undefined
  }
}
