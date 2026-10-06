import { Link } from 'react-router-dom'
import { resourceCategoryIcons } from '@/components/resources/resourceIcons'
import { quickAccessLinks } from '@/data/resources'

/** Quick Access: compact links into the existing modules. */
export function ResourceQuickLinks() {
  return (
    <ul aria-label="Quick access" className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {quickAccessLinks.map((link) => {
        const Icon = resourceCategoryIcons[link.icon]
        return (
          <li key={link.id} className="bg-white">
            <Link
              to={link.href}
              className="group flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-gold" strokeWidth={1.5} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block group-hover:underline">{link.label}</span>
                <span className="block text-xs font-normal text-muted-foreground">{link.description}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
