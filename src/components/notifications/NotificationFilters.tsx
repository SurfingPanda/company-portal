import { notificationMeta } from '@/components/notifications/notificationMeta'
import { cn } from '@/lib/utils'
import type { NotificationFilter, NotificationType } from '@/types/notification'

const typeOrder: NotificationType[] = ['announcement', 'request', 'event', 'document', 'system', 'hr', 'it']

interface NotificationFiltersProps {
  selected: NotificationFilter
  unreadCount: number
  onChange: (filter: NotificationFilter) => void
}

/** Filter buttons. They scroll sideways inside their own container on narrow screens. */
export function NotificationFilters({ selected, unreadCount, onChange }: NotificationFiltersProps) {
  const options: { id: NotificationFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    ...typeOrder.map((t) => ({ id: t as NotificationFilter, label: notificationMeta[t].filterLabel })),
  ]

  return (
    <div role="group" aria-label="Filter notifications" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const active = option.id === selected
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cn(
              'min-h-9 shrink-0 border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              active ? 'border-primary bg-primary text-primary-foreground' : 'bg-white text-foreground hover:bg-accent',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
