import { Briefcase, CalendarCheck, ClipboardList, FileText, HeartPulse, IdCard, ListChecks, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { hrQuickLinks, type HRQuickLink } from '@/data/hrServices'
import { cn } from '@/lib/utils'

const icons: Record<HRQuickLink['icon'], LucideIcon> = {
  leave: CalendarCheck,
  forms: ClipboardList,
  benefits: HeartPulse,
  employee: IdCard,
  careers: Briefcase,
  documents: FileText,
  requests: ListChecks,
}

const rowClass =
  'group flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

function QuickLinkContent({ link, showDescription }: { link: HRQuickLink; showDescription: boolean }) {
  const Icon = icons[link.icon]
  return (
    <>
      <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-gold" strokeWidth={1.5} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block group-hover:underline">{link.label}</span>
        {showDescription && <span className="block text-xs font-normal text-muted-foreground">{link.description}</span>}
      </span>
    </>
  )
}

function QuickLink({ link, showDescription }: { link: HRQuickLink; showDescription: boolean }) {
  if (link.href) {
    return (
      <Link to={link.href} className={rowClass}>
        <QuickLinkContent link={link} showDescription={showDescription} />
      </Link>
    )
  }

  const Icon = icons[link.icon]
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground">
      <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block">{link.label}</span>
        {showDescription && <span className="block text-xs font-normal">{link.description}</span>}
      </span>
    </div>
  )
}

interface HRQuickAccessProps {
  /** Show only these quick links, in this order. Defaults to all of them. */
  ids?: string[]
  /** "grid" is the HR landing layout; "list" is the compact single column used on Home. */
  layout?: 'grid' | 'list'
}

/** Compact HR links. One list (`hrQuickLinks`) feeds both the HR landing page and the Home page. */
export function HRQuickAccess({ ids, layout = 'grid' }: HRQuickAccessProps) {
  const links = ids ? ids.map((id) => hrQuickLinks.find((l) => l.id === id)).filter((l): l is HRQuickLink => Boolean(l)) : hrQuickLinks

  return (
    <ul aria-label="HR quick access" className={cn('bg-white ring-1 ring-border', layout === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-4' : '')}>
      {links.map((link) => (
        <li key={link.id} className={cn('border-b border-border last:border-b-0', layout === 'grid' && 'sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0 lg:[&:nth-last-child(-n+4)]:border-b-0')}>
          <QuickLink link={link} showDescription={layout === 'grid'} />
        </li>
      ))}
    </ul>
  )
}
