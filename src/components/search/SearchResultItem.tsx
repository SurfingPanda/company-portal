import { ArrowRight, BookOpen, Briefcase, Building2, CalendarDays, CircleHelp, ClipboardList, FileText, HeartPulse, LayoutGrid, Megaphone, Globe, User, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { formatDate } from '@/lib/format'
import type { GlobalSearchResult, SearchResultType } from '@/types/search'

export const searchTypeLabels: Record<SearchResultType, string> = {
  document: 'Document',
  form: 'Form / Request',
  service: 'Service',
  benefit: 'Benefit',
  announcement: 'Announcement',
  event: 'Event',
  helpdesk: 'Helpdesk',
  job: 'Job Opening',
  resource: 'Resource',
  company: 'Company',
  faq: 'FAQ',
  directory: 'Directory',
}

const icons: Record<SearchResultType, LucideIcon> = {
  document: FileText,
  form: ClipboardList,
  service: LayoutGrid,
  benefit: HeartPulse,
  announcement: Megaphone,
  event: CalendarDays,
  helpdesk: BookOpen,
  job: Briefcase,
  resource: Globe,
  company: Building2,
  faq: CircleHelp,
  directory: User,
}

const actionLabels: Record<SearchResultType, string> = {
  document: 'View document',
  form: 'Open form',
  service: 'Open service',
  benefit: 'View benefit',
  announcement: 'Read announcement',
  event: 'View event',
  helpdesk: 'Read article',
  job: 'View position',
  resource: 'Open resource',
  company: 'View page',
  faq: 'View answer',
  directory: 'View profile',
}

/** Compact result row: icon, title, "Type • Category", description, optional date, and a text action. */
export function SearchResultItem({ result, onOpen }: { result: GlobalSearchResult; onOpen?: () => void }) {
  const Icon = icons[result.type]

  return (
    <Link
      to={result.route ?? '/resources'}
      onClick={onOpen}
      className="group flex items-start gap-3 bg-white px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-gold" strokeWidth={1.5} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-primary group-hover:underline">{result.title}</span>
          {result.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </span>
        <span className="block text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
          {searchTypeLabels[result.type]}
          {result.category ? ` • ${result.category}` : ''}
          {result.date ? ` • ${formatDate(result.date)}` : ''}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] leading-snug text-foreground/80">{result.description}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
          {actionLabels[result.type]}
          <ArrowRight className="size-3" aria-hidden="true" />
        </span>
      </span>
    </Link>
  )
}
