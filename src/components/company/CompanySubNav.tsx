import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { companyNavItems } from '@/data/navigation'

/** Section navigation shown on every Company page; mirrors the main navigation's active style. */
export function CompanySubNav() {
  return (
    <nav aria-label="Company sections" className="mt-4 border-b">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {companyNavItems.map((item) => (
          <li key={item.href}>
            <NavLink
              to={item.href}
              end
              className={({ isActive }) =>
                cn(
                  'block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  isActive
                    ? 'border-gold text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-primary',
                )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
