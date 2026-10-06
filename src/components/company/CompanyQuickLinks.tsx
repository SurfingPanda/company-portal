import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { companyNavItems } from '@/data/navigation'

/** Compact navigation to the Company subsections. */
export function CompanyQuickLinks() {
  return (
    <nav aria-labelledby="company-links-heading">
      <h2 id="company-links-heading" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">
        Company Information
      </h2>
      <ul>
        {companyNavItems
          .filter((item) => item.href !== '/company')
          .map((item) => (
            <li key={item.href} className="border-b border-border">
              <Link
                to={item.href}
                className="group flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:-mx-2 sm:px-2"
              >
                <span>
                  <span className="block text-sm font-semibold text-primary group-hover:underline">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{item.description}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-gold" aria-hidden="true" />
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  )
}
