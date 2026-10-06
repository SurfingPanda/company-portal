import { CompanyContent } from '@/components/company/CompanyContent'
import { CompanyPageShell } from '@/components/company/CompanyPageShell'
import { CompanySectionHeader } from '@/components/company/CompanySectionHeader'
import { hasPlaceholder } from '@/components/company/ContentStatus'
import { DepartmentList } from '@/components/company/DepartmentList'
import { useAsync } from '@/hooks/useAsync'
import { Link } from 'react-router-dom'
import { getDepartments } from '@/services/companyService'

export default function CompanyDepartments() {
  const { data, error, retry } = useAsync(getDepartments, [])

  return (
    <CompanyPageShell
      title="Departments"
      description="The departments of Eljin Corporation."
      section="Departments"
      showPlaceholderNotice={data ? hasPlaceholder(data) : false}
    >
      <CompanyContent data={data} error={error} onRetry={retry}>
        {(departments) => (
          <section aria-labelledby="department-list-heading">
            <CompanySectionHeader id="department-list-heading" title="Departments" />
            <p className="mb-4 text-sm text-muted-foreground">
              Looking for who reports to whom? See the{' '}
              <Link to="/company/organization" className="font-medium text-primary underline-offset-4 hover:underline">organization chart</Link>.
            </p>
            <DepartmentList departments={departments} />
          </section>
        )}
      </CompanyContent>
    </CompanyPageShell>
  )
}
