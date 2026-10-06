export type ThemePreference = 'system' | 'light' | 'dark'
export type TextSize = 'default' | 'large'
export type ResourceView = 'cards' | 'list'
/** How portal notifications also reach the person by email: each one at once, one summary each morning, or never. */
export type EmailMode = 'instant' | 'daily' | 'off'

/**
 * Portal-level UI preferences. They belong to the Employee Portal only and never change HR records.
 * Non-sensitive by design: no credentials, tokens, MFA data or profile details (those live elsewhere).
 * Shaped for a future `GET/PUT /api/account/preferences` resource.
 */
export interface PortalPreferences {
  /** Only the dashboard exists today; kept as a future-compatible preference. */
  dashboardStartPage: 'dashboard'
  resourceView: ResourceView
  /** When off, recent searches are not saved (and existing ones are cleared). */
  rememberSearchHistory: boolean

  /** Which kinds of PORTAL notifications are shown. Does not affect email, SMS or any outside system. */
  notifications: {
    announcements: boolean
    hr: boolean
    it: boolean
    requests: boolean
    events: boolean
    documents: boolean
  }

  /** Email delivery of portal notifications. Needs the Laravel server; in development mock mode nothing is emailed. */
  emailMode: EmailMode

  accessibility: {
    reduceMotion: boolean
    textSize: TextSize
    highContrast: boolean
  }

  appearance: {
    theme: ThemePreference
  }
}
