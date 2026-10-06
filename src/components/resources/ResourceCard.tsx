import { ArrowRight, CircleHelp, ClipboardList, ExternalLink, FileText, Globe, LayoutGrid, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { getResourceCategoryLabel, resourceTypeLabels } from '@/services/resourceService'
import type { EmployeeResource, ResourceType } from '@/types/resource'

const typeIcons: Record<ResourceType, LucideIcon> = {
  document: FileText,
  form: ClipboardList,
  service: LayoutGrid,
  page: Globe,
  faq: CircleHelp,
  external: ExternalLink,
}

/** Compact resource row/card: icon, title, description, category and type as text, optional Featured and Sample tags. */
export function ResourceCard({ resource, showFeatured = true }: { resource: EmployeeResource; showFeatured?: boolean }) {
  const Icon = typeIcons[resource.type]

  return (
    <Link
      to={resource.route ?? '/resources'}
      className="group flex h-full items-start gap-3 bg-white px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-gold" strokeWidth={1.5} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-primary group-hover:underline">{resource.title}</span>
          {showFeatured && resource.isFeatured && <span className="border border-gold/50 px-1 text-[0.625rem] font-semibold uppercase tracking-wider text-gold">Featured</span>}
          {resource.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] leading-snug text-muted-foreground">{resource.description}</span>
        <span className="mt-1 block text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
          {getResourceCategoryLabel(resource.category)} · {resourceTypeLabels[resource.type]}
        </span>
      </span>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

/** Layout of a resource list from the "Default Resource View" preference: two-column cards on wide screens, or one list column. */
export const resourceGridClass = (view: 'cards' | 'list') => (view === 'list' ? 'grid gap-px border bg-border' : 'grid gap-px border bg-border md:grid-cols-2')
