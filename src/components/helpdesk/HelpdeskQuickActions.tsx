import { BookOpen, ChevronRight, Ticket, TicketPlus, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export const helpdeskActions: { label: string; description: string; href: string; icon: LucideIcon }[] = [
  { label: 'Submit a Request', description: 'Report a problem or ask IT for help.', href: '/helpdesk/new', icon: TicketPlus },
  { label: 'My Tickets', description: 'Track your IT support tickets.', href: '/helpdesk/tickets', icon: Ticket },
  { label: 'Knowledge Base', description: 'Find answers to common problems.', href: '/helpdesk/knowledge-base', icon: BookOpen },
]

/** Compact links to the main helpdesk areas. */
export function HelpdeskQuickActions() {
  return (
    <ul className="grid border-l border-t bg-white sm:grid-cols-2 lg:grid-cols-4">
      {helpdeskActions.map(({ label, description, href, icon: Icon }) => (
        <li key={href} className="border-b border-r">
          <Link
            to={href}
            className="group flex h-full items-start gap-3 p-4 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <Icon className="mt-0.5 size-[18px] shrink-0 text-primary group-hover:text-gold" strokeWidth={1.5} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-base font-semibold leading-tight text-primary group-hover:underline">{label}</span>
              <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted-foreground">{description}</span>
            </span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/0 group-hover:text-gold" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
