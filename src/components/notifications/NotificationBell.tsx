import type { ComponentProps } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/context/NotificationContext'

/**
 * The portal's one notification bell. The unread count comes from the notification provider.
 * Props (including aria-expanded and the ref) are supplied by the dropdown trigger.
 */
export function NotificationBell(props: ComponentProps<typeof Button>) {
  const { unreadCount } = useNotifications()
  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications, no unread'

  return (
    <Button variant="ghost" size="icon" className="relative text-primary" aria-label={label} {...props}>
      <Bell className="size-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[0.625rem] font-semibold leading-none tabular-nums text-primary-foreground ring-2 ring-white"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  )
}
