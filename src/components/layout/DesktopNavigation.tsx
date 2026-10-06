import { NavLink, useLocation } from 'react-router-dom'
import { isAlsoActive } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useNavigationItems } from '@/auth/useNavigationItems'

export function DesktopNavigation() {
  const navigationItems = useNavigationItems()
  const { pathname } = useLocation()

  return (
    <nav aria-label="Main" className="hidden h-full flex-1 lg:block">
      <ul className="flex h-full items-stretch gap-1">
        {navigationItems.map((item) => (
          <li key={item.href} className="flex">
            <NavLink
              to={item.href}
              end={item.href === '/'}
              className={({ isActive: routeActive }) =>
                cn(
                  'flex items-center border-b-2 px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  routeActive || isAlsoActive(item, pathname)
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
