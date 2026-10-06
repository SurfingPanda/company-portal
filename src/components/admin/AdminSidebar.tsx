import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { adminNavigation, type AdminNavItem } from '@/components/admin/adminNav'
import { Wordmark } from '@/components/common/Wordmark'
import { useAuthorization } from '@/auth/useAuthorization'
import { cn } from '@/lib/utils'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block border-l-2 py-1.5 pl-4 pr-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
    isActive ? 'border-white bg-white/10 font-semibold text-white' : 'border-transparent text-on-navy/80 hover:bg-white/5 hover:text-white',
  )

/** Collapsible grouped menu. Items the person has no permission for are not shown; Laravel still rejects direct API calls. */
export function AdminSidebar() {
  const { hasAnyPermission } = useAuthorization()
  const { pathname } = useLocation()
  const visible = (item: AdminNavItem) => item.permissions.length === 0 || hasAnyPermission(item.permissions)
  const groups = adminNavigation.groups.map((g) => ({ ...g, items: g.items.filter(visible) })).filter((g) => g.items.length > 0)
  const [closed, setClosed] = useState<Record<string, boolean>>({})

  return (
    <nav aria-label="Administration menu" className="flex flex-1 flex-col py-4">
      <div className="px-4 pb-4">
        <Wordmark inverted />
        <p className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-on-navy/70">Administration</p>
      </div>

      <NavLink to={adminNavigation.top.href} className={linkClass}>
        {adminNavigation.top.label}
      </NavLink>

      {groups.map((group) => {
        const open = !closed[group.label] || group.items.some((i) => pathname.startsWith(i.href))
        const id = `admin-nav-${group.label.replace(/\s+/g, '-').toLowerCase()}`
        return (
          <div key={group.label} className="mt-4">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={id}
              onClick={() => setClosed((prev) => ({ ...prev, [group.label]: open }))}
              className="flex w-full items-center justify-between px-4 py-1.5 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-on-navy/70 hover:text-white focus-visible:outline-2 focus-visible:outline-ring"
            >
              {group.label}
              <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
            </button>
            <ul id={id} hidden={!open}>
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink to={item.href} end={item.end} className={linkClass}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
