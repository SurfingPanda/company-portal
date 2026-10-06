import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

const sections = [
  { label: 'Overview', href: '/resources', end: true },
  { label: 'HR', href: '/resources/hr', end: true },
  { label: 'IT', href: '/resources/it', end: true },
  { label: 'Company', href: '/resources/company', end: true },
  { label: 'FAQ', href: '/resources/faq', end: true },
]

interface ResourcesPageShellProps {
  title: string
  description: string
  /** Extra breadcrumb level after "Employee Resource Center". Omit on the overview. */
  current?: string
  children: ReactNode
}

/** Common frame for the Resource Center pages: header, section tabs, content. */
export function ResourcesPageShell({ title, description, current, children }: ResourcesPageShellProps) {
  const breadcrumbs = current ? [{ label: 'Employee Resource Center', href: '/resources' }, { label: current }] : [{ label: 'Employee Resource Center' }]

  return (
    <PageContainer className="pb-16">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      <nav aria-label="Resource Center sections" className="mt-4 border-b">
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
      <div className="mt-8">{children}</div>
    </PageContainer>
  )
}

/** A bordered list of links into existing modules. */
export function ResourceLinkList({ label, links }: { label: string; links: { label: string; description?: string; href: string }[] }) {
  return (
    <ul aria-label={label} className="divide-y border bg-white">
      {links.map((l) => (
        <li key={l.href + l.label}>
          <Link to={l.href} className="block px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent hover:underline focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
            {l.label}
            {l.description && <span className="block text-xs font-normal text-muted-foreground">{l.description}</span>}
          </Link>
        </li>
      ))}
    </ul>
  )
}
