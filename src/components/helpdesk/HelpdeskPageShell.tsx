import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

const sections = [
  { label: 'Overview', href: '/helpdesk', end: true },
  { label: 'Submit a Request', href: '/helpdesk/new', end: true },
  { label: 'My Tickets', href: '/helpdesk/tickets', end: false },
  { label: 'Knowledge Base', href: '/helpdesk/knowledge-base', end: false },
]

function HelpdeskSubNav() {
  return (
    <nav aria-label="IT Helpdesk sections" className="mt-4 border-b">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {sections.map((s) => (
          <li key={s.href}>
            <NavLink
              to={s.href}
              end={s.end}
              className={({ isActive }) =>
                cn(
                  'block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  isActive ? 'border-gold text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-primary',
                )
              }
            >
              {s.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

interface HelpdeskPageShellProps {
  title: string
  description: string
  /** Extra breadcrumb levels after "IT Helpdesk". Omit on the overview. */
  trail?: { label: string; href?: string }[]
  actions?: ReactNode
  children: ReactNode
}

/** Common frame for every helpdesk page: header, section navigation, content. */
export function HelpdeskPageShell({ title, description, trail, actions, children }: HelpdeskPageShellProps) {
  const breadcrumbs = trail ? [{ label: 'IT Helpdesk', href: '/helpdesk' }, ...trail] : [{ label: 'IT Helpdesk' }]

  return (
    <PageContainer className="pb-16">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} actions={actions} />
      <HelpdeskSubNav />
      <div className="mt-8">{children}</div>
    </PageContainer>
  )
}
