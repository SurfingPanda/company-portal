import { CompanyContent } from '@/components/company/CompanyContent'
import { CompanyPageShell } from '@/components/company/CompanyPageShell'
import { hasPlaceholder } from '@/components/company/ContentStatus'
import { OrganizationChart } from '@/components/company/OrganizationChart'
import { useAsync } from '@/hooks/useAsync'
import { getOrganizationStructure } from '@/services/companyService'

/** Who reports to whom, drawn from the reporting lines HR keeps on the employee records. */
export default function CompanyOrganization() {
  const { data, error, retry } = useAsync(getOrganizationStructure, [])

  return (
    <CompanyPageShell
      title="Organization Chart"
      description="Who reports to whom at Eljin Corporation."
      section="Organization Chart"
      showPlaceholderNotice={data ? hasPlaceholder(data) : false}
    >
      <CompanyContent data={data} error={error} onRetry={retry}>
        {(structure) => <OrganizationChart structure={structure} />}
      </CompanyContent>
    </CompanyPageShell>
  )
}
