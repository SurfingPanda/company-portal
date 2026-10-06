import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

const sections = [
  { label: 'Overview', href: '/recruitment', end: true },
  { label: 'Job Openings', href: '/recruitment/jobs', end: false },
  { label: 'My Applications', href: '/recruitment/applications', end: false },
]

interface RecruitmentHeaderProps {
  title: string
  description: string
  /** Extra breadcrumb levels after "Recruitment & Careers". Omit on the overview. */
  trail?: { label: string; href?: string }[]
  actions?: ReactNode
  children: ReactNode
}

/** Common frame for the recruitment pages: header, section navigation, content. Recruitment sits under HR & Employee Services. */
export function RecruitmentHeader({ title, description, trail, actions, children }: RecruitmentHeaderProps) {
  const parent = { label: 'HR & Employee Services', href: '/hr' }
  const breadcrumbs = trail ? [parent, { label: 'Recruitment & Careers', href: '/recruitment' }, ...trail] : [parent, { label: 'Recruitment & Careers' }]

  return (
    <PageContainer className="pb-16">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} actions={actions} />
      <nav aria-label="Recruitment sections" className="mt-4 border-b">
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
