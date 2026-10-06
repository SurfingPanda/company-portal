import { CompanyContent } from '@/components/company/CompanyContent'
import { CompanyPageShell } from '@/components/company/CompanyPageShell'
import { hasPlaceholder } from '@/components/company/ContentStatus'
import { LocationList } from '@/components/company/LocationList'
import { useAsync } from '@/hooks/useAsync'
import { getLocations } from '@/services/companyService'

export default function CompanyLocations() {
  const { data, error, retry } = useAsync(getLocations, [])

  return (
    <CompanyPageShell
      title="Locations"
      description="Offices and facilities of Eljin Corporation."
      section="Locations"
      showPlaceholderNotice={data ? hasPlaceholder(data) : false}
    >
      <CompanyContent data={data} error={error} onRetry={retry}>
        {(locations) => <LocationList locations={locations} />}
      </CompanyContent>
    </CompanyPageShell>
  )
}
