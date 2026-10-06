import { CompanyContent } from '@/components/company/CompanyContent'
import { CompanyPageShell } from '@/components/company/CompanyPageShell'
import { CompanyTimeline } from '@/components/company/CompanyTimeline'
import { hasPlaceholder } from '@/components/company/ContentStatus'
import { useAsync } from '@/hooks/useAsync'
import { getCompanyHistory } from '@/services/companyService'

export default function CompanyHistory() {
  const { data, error, retry } = useAsync(getCompanyHistory, [])

  return (
    <CompanyPageShell
      title="Company History"
      description="Key milestones in the history of Eljin Corporation."
      section="History"
      showPlaceholderNotice={data ? hasPlaceholder(data) : false}
    >
      <CompanyContent data={data} error={error} onRetry={retry}>
        {(milestones) => <CompanyTimeline milestones={milestones} />}
      </CompanyContent>
    </CompanyPageShell>
  )
}
