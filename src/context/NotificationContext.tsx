import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import { notificationPreferenceKey } from '@/lib/portalPreferences'
import { isApiMode } from '@/services/dataMode'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notificationService'
import type { NewNotification, Notification } from '@/types/notification'

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: Error | undefined
  retry: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: NewNotification) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

/**
 * Single source of notification state for the whole portal (navbar bell, Notifications page, Home).
 *
 * It loads through `notificationService` and applies read/remove changes optimistically.
 * To go live, only the service functions need to call the Laravel API; a real-time source
 * (broadcasting, polling or SSE) can simply call `addNotification` when a new one arrives.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [allNotifications, setNotifications] = useState<Notification[]>([])
  const { preferences } = usePortalPreferences()
  // Portal notification preferences control what is shown here. They do not affect email, SMS or other systems.
  const notifications = useMemo(
    () =>
      allNotifications.filter((n) => {
        const key = notificationPreferenceKey(n.type)
        return key ? preferences.notifications[key] : true
      }),
    [allNotifications, preferences.notifications],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error>()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(undefined)
    getNotifications().then(
      (data) => {
        if (cancelled) return
        setNotifications(data)
        setLoading(false)
      },
      (e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e : new Error('Unable to load notifications'))
        setLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    // If the server rejects the change, reload so the list matches reality instead of pretending it worked.
    markNotificationRead(id).catch(() => setAttempt((n) => n + 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })))
    markAllNotificationsRead().catch(() => setAttempt((n) => n + 1))
  }, [])

  // Client-side creation for the prototype. With an API, the server creates notifications and pushes them here.
  const addNotification = useCallback((input: NewNotification) => {
    // With a backend, the SERVER creates notifications when it processes an action. Never fabricate one in the browser.
    if (isApiMode) return
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    setNotifications((prev) => [
      { priority: 'normal', ...input, id: `n-local-${now.getTime()}`, createdAt, isRead: false, isSample: true },
      ...prev,
    ])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      loading,
      error,
      retry,
      markAsRead,
      markAllAsRead,
      addNotification,
      removeNotification,
    }),
    [notifications, loading, error, retry, markAsRead, markAllAsRead, addNotification, removeNotification],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return context
}
