import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

const sections = [
  { label: 'Overview', href: '/benefits', end: true },
  { label: 'FAQ', href: '/benefits/faq', end: true },
  { label: 'Resources', href: '/benefits/resources', end: true },
]

interface BenefitsPageShellProps {
  title: string
  description: string
  /** Extra breadcrumb levels after "Benefits & Employee Resources". Omit on the overview. */
  trail?: { label: string; href?: string }[]
  children: ReactNode
}

/** Common frame for the Benefits pages. Benefits sits under HR & Employee Services. */
export function BenefitsPageShell({ title, description, trail, children }: BenefitsPageShellProps) {
  const parent = { label: 'HR & Employee Services', href: '/hr' }
  const breadcrumbs = trail ? [parent, { label: 'Benefits & Employee Resources', href: '/benefits' }, ...trail] : [parent, { label: 'Benefits & Employee Resources' }]

  return (
    <PageContainer className="pb-16">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      <nav aria-label="Benefits sections" className="mt-4 border-b">
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
