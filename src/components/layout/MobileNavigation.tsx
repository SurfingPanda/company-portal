import { useState } from 'react'
import { Menu } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/common/EmployeeAvatar'
import { Wordmark } from '@/components/common/Wordmark'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { isAlsoActive } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useNavigationItems } from '@/auth/useNavigationItems'
import { supportLinks } from '@/data/navigation'
import { useAuth } from '@/context/AuthContext'
import { getUserFullName } from '@/lib/user'

export function MobileNavigation() {
  const navigationItems = useNavigationItems()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary lg:hidden" aria-label="Open navigation menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(20rem,88vw)] flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SheetDescription className="sr-only">Browse the Eljin employee portal.</SheetDescription>
          <Wordmark className="h-9" />
        </SheetHeader>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto py-2">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  onClick={close}
                  className={({ isActive: routeActive }) =>
                    cn(
                      'block border-l-[3px] px-5 py-3 text-[0.9375rem] font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      routeActive || isAlsoActive(item, pathname)
                        ? 'border-gold bg-accent text-primary'
                        : 'border-transparent text-foreground hover:bg-accent',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <ul className="mt-2 border-t pt-2">
            {supportLinks.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={close}
                  className="block px-5 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div className="flex items-center gap-3 border-t bg-secondary px-5 py-4">
            <EmployeeAvatar name={getUserFullName(user)} imageUrl={user.avatarUrl} className="size-10" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">{getUserFullName(user)}</p>
              <p className="text-xs text-muted-foreground">{user.jobTitle}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
