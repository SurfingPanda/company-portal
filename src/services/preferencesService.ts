import * as apiAdapter from '@/services/adapters/preferences.api'
import { isApiMode } from '@/services/dataMode'
import type { PortalPreferences } from '@/types/portalPreferences'

/**
 * Server copy of the portal preferences (GET/PUT /api/account/preferences, POST .../reset).
 * Mock mode has no server: the browser copy in PortalPreferencesContext is the only one, so these resolve to "nothing to do".
 * In API mode the browser copy stays as an immediate cache and offline fallback; a failed sync never loses the local change.
 */
export const fetchPreferences = (): Promise<PortalPreferences | null> => (isApiMode ? apiAdapter.fetchPreferences() : Promise.resolve(null))
export const pushPreferences = (preferences: PortalPreferences): Promise<void> => (isApiMode ? apiAdapter.pushPreferences(preferences) : Promise.resolve())
export const resetServerPreferences = (): Promise<PortalPreferences | null> => (isApiMode ? apiAdapter.resetServerPreferences() : Promise.resolve(null))
