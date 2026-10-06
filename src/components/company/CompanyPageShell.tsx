import type { ReactNode } from 'react'
import { PlaceholderNotice } from '@/components/company/ContentStatus'
import { CompanySubNav } from '@/components/company/CompanySubNav'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'

interface CompanyPageShellProps {
  title: string
  description: string
  /** Section name shown after "Company" in the breadcrumb; omit on the overview. */
  section?: string
  /** Show the "content pending" notice. */
  showPlaceholderNotice?: boolean
  children: ReactNode
}

/** Common frame for every Company page: header, section navigation, notice, then content. */
export function CompanyPageShell({ title, description, section, showPlaceholderNotice, children }: CompanyPageShellProps) {
  const breadcrumbs = section ? [{ label: 'Company', href: '/company' }, { label: section }] : [{ label: 'Company' }]

  return (
    <PageContainer className="pb-16">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      {section && <CompanySubNav />}
      {showPlaceholderNotice && <PlaceholderNotice className="mt-6" />}
      <div className="mt-8 space-y-10">{children}</div>
    </PageContainer>
  )
}
