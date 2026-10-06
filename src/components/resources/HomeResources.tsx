import { Link } from 'react-router-dom'
import { SectionHeading } from '@/components/common/SectionHeading'
import { homeResourceIds } from '@/data/resources'
import { useAsync } from '@/hooks/useAsync'
import { getResourcesByIds } from '@/services/resourceService'

/** Compact "Employee Resources" block for Home, built from the central resource index. */
export function HomeResources() {
  const { data } = useAsync(() => getResourcesByIds(homeResourceIds), [])

  return (
    <section aria-labelledby="home-resources-heading">
      <SectionHeading
        id="home-resources-heading"
        title="Employee Resources"
        action={
          <Link to="/resources" className="shrink-0 text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline">
            View All Resources →
          </Link>
        }
      />
      <ul className="bg-white ring-1 ring-border">
        {(data ?? []).map((r) => (
          <li key={r.id} className="border-b border-border last:border-b-0">
            <Link
              to={r.route ?? '/resources'}
              className="group block px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <span className="group-hover:underline">{r.title}</span>
              <span className="block text-xs font-normal text-muted-foreground">{r.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
