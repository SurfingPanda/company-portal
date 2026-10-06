import type { PortalPreferences } from '@/types/portalPreferences'

/** Where preferences are kept for now. The same key is read by the small pre-paint theme script in index.html. */
export const PORTAL_PREFERENCES_STORAGE_KEY = 'eljin-portal-preferences'

/** The one place defaults are defined. "Reset Preferences" restores exactly this. */
export const defaultPortalPreferences: PortalPreferences = {
  dashboardStartPage: 'dashboard',
  resourceView: 'cards',
  rememberSearchHistory: true,

  notifications: {
    announcements: true,
    hr: true,
    it: true,
    requests: true,
    events: true,
    documents: true,
  },

  emailMode: 'daily',

  accessibility: {
    reduceMotion: false,
    textSize: 'default',
    highContrast: false,
  },

  appearance: {
    theme: 'system',
  },
}
