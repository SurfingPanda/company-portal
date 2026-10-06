import { useCallback, useState } from 'react'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import { normalize } from '@/utils/globalSearch'

const KEY = 'eljin.portal.recentSearches'
const MAX_RECENT = 5

/** localStorage can be missing or blocked (private windows, site data cleared); every access fails quietly. */
function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string').slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function write(values: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(values))
  } catch {
    // ignore: recent searches are a convenience only
  }
}

/** Removes remembered searches from this browser (used by Account Settings → Privacy). */
export function clearStoredRecentSearches() {
  write([])
}

/**
 * Last few search phrases, kept only in this browser. Nothing is sent to a server.
 * Honours the "Remember recent searches" portal preference: when off, nothing is saved or shown.
 */
export function useRecentSearches() {
  const { preferences } = usePortalPreferences()
  const remember = preferences.rememberSearchHistory
  const [stored, setStored] = useState<string[]>(read)
  const recent = remember ? stored : []

  const add = useCallback(
    (query: string) => {
      if (!remember) return
      const trimmed = query.trim()
      if (trimmed.length < 2) return
      setStored((prev) => {
        const next = [trimmed, ...prev.filter((s) => normalize(s) !== normalize(trimmed))].slice(0, MAX_RECENT)
        write(next)
        return next
      })
    },
    [remember],
  )

  const clear = useCallback(() => {
    write([])
    setStored([])
  }, [])

  return { recent, add, clear }
}
