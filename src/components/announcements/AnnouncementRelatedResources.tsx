import { CalendarDays, ClipboardList, FileText, LayoutGrid, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { RelatedResource } from '@/types/announcement'

const icons: Record<RelatedResource['kind'], LucideIcon> = {
  document: FileText,
  event: CalendarDays,
  service: LayoutGrid,
  form: ClipboardList,
}

/** Links to existing Documents, Calendar, Services and Forms pages. Their data is not copied here. */
export function AnnouncementRelatedResources({ resources }: { resources: RelatedResource[] }) {
  if (resources.length === 0) return null

  return (
    <section aria-labelledby="related-resources-heading">
      <h2 id="related-resources-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
        Related Resources
      </h2>
      <ul className="bg-white ring-1 ring-border">
        {resources.map((r) => {
          const Icon = icons[r.kind]
          return (
            <li key={`${r.kind}-${r.id}`} className="border-b border-border last:border-b-0">
              <Link
                to={r.href}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-gold" strokeWidth={1.5} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-primary">{r.title}</span>
                  <span className="block text-xs text-muted-foreground group-hover:underline">{r.actionLabel} →</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
