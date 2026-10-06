import { api } from '@/services/api'
import type { ApiResponse } from '@/types/api'
import type { EmailMode, PortalPreferences, ResourceView, TextSize, ThemePreference } from '@/types/portalPreferences'

/** Portal preferences, Laravel adapter: GET/PUT /api/account/preferences. The server always uses the signed-in user's own record. */
interface ApiPreferences {
  dashboard_start_page: 'dashboard'
  resource_view: ResourceView
  remember_search_history: boolean
  notify_announcements: boolean
  notify_hr: boolean
  notify_it: boolean
  notify_requests: boolean
  notify_events: boolean
  notify_documents: boolean
  email_mode: EmailMode
  reduce_motion: boolean
  text_size: TextSize
  high_contrast: boolean
  theme: ThemePreference
}

const fromApi = (p: ApiPreferences): PortalPreferences => ({
  dashboardStartPage: p.dashboard_start_page,
  resourceView: p.resource_view,
  rememberSearchHistory: p.remember_search_history,
  notifications: { announcements: p.notify_announcements, hr: p.notify_hr, it: p.notify_it, requests: p.notify_requests, events: p.notify_events, documents: p.notify_documents },
  emailMode: p.email_mode,
  accessibility: { reduceMotion: p.reduce_motion, textSize: p.text_size, highContrast: p.high_contrast },
  appearance: { theme: p.theme },
})

const toApi = (p: PortalPreferences): ApiPreferences => ({
  dashboard_start_page: p.dashboardStartPage,
  resource_view: p.resourceView,
  remember_search_history: p.rememberSearchHistory,
  notify_announcements: p.notifications.announcements,
  notify_hr: p.notifications.hr,
  notify_it: p.notifications.it,
  notify_requests: p.notifications.requests,
  notify_events: p.notifications.events,
  notify_documents: p.notifications.documents,
  email_mode: p.emailMode,
  reduce_motion: p.accessibility.reduceMotion,
  text_size: p.accessibility.textSize,
  high_contrast: p.accessibility.highContrast,
  theme: p.appearance.theme,
})

export async function fetchPreferences(): Promise<PortalPreferences | null> {
  return fromApi((await api.get<ApiResponse<ApiPreferences>>('/api/account/preferences')).data)
}

export async function pushPreferences(preferences: PortalPreferences): Promise<void> {
  await api.put('/api/account/preferences', toApi(preferences))
}

export async function resetServerPreferences(): Promise<PortalPreferences | null> {
  return fromApi((await api.post<ApiResponse<ApiPreferences>>('/api/account/preferences/reset')).data)
}
