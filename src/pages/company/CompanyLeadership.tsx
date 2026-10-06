import { CompanyContent } from '@/components/company/CompanyContent'
import { CompanyPageShell } from '@/components/company/CompanyPageShell'
import { hasPlaceholder } from '@/components/company/ContentStatus'
import { LeadershipPreview } from '@/components/company/LeadershipPreview'
import { useAsync } from '@/hooks/useAsync'
import { getLeadership } from '@/services/companyService'

export default function CompanyLeadership() {
  const { data, error, retry } = useAsync(getLeadership, [])

  return (
    <CompanyPageShell
      title="Leadership"
      description="Meet the people responsible for guiding Eljin Corporation."
      section="Leadership"
      showPlaceholderNotice={data ? hasPlaceholder(data) : false}
    >
      <CompanyContent data={data} error={error} onRetry={retry}>
        {(members) => <LeadershipPreview members={members} showBiography />}
      </CompanyContent>
    </CompanyPageShell>
  )
}
