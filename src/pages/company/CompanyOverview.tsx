import { CompanyContent } from '@/components/company/CompanyContent'
import { CompanyIntro } from '@/components/company/CompanyIntro'
import { CompanyPageShell } from '@/components/company/CompanyPageShell'
import { CompanyQuickLinks } from '@/components/company/CompanyQuickLinks'
import { CompanySectionHeader } from '@/components/company/CompanySectionHeader'
import { CompanyTimeline } from '@/components/company/CompanyTimeline'
import { hasPlaceholder } from '@/components/company/ContentStatus'
import { CoreValues } from '@/components/company/CoreValues'
import { DepartmentList } from '@/components/company/DepartmentList'
import { LeadershipPreview } from '@/components/company/LeadershipPreview'
import { LocationList } from '@/components/company/LocationList'
import { MissionVision } from '@/components/company/MissionVision'
import { useAsync } from '@/hooks/useAsync'
import { getCompanyOverview } from '@/services/companyService'

export default function CompanyOverview() {
  const { data, error, retry } = useAsync(getCompanyOverview, [])

  const pending = data
    ? hasPlaceholder(
        data.profile.introduction,
        data.profile.mission,
        data.profile.vision,
        data.profile.values,
        data.milestones,
        data.leadership,
        data.departments,
        data.locations,
      )
    : false

  return (
    <CompanyPageShell
      title="Company"
      description="Learn more about Eljin Corporation, our people, our organization, and the work we do."
      showPlaceholderNotice={pending}
    >
      <CompanyContent data={data} error={error} onRetry={retry}>
        {({ profile, milestones, leadership, departments, locations }) => (
          <>
            <div className="grid gap-10 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CompanyIntro profile={profile} />
              </div>
              <CompanyQuickLinks />
            </div>
            <MissionVision profile={profile} />
            <CoreValues values={profile.values} />
            <section aria-labelledby="history-preview-heading">
              <CompanySectionHeader id="history-preview-heading" title="Company History" href="/company/history" />
              <CompanyTimeline milestones={milestones} limit={3} />
            </section>
            <section aria-labelledby="leadership-preview-heading">
              <CompanySectionHeader id="leadership-preview-heading" title="Leadership" href="/company/leadership" />
              <LeadershipPreview members={leadership} limit={4} />
            </section>
            <section aria-labelledby="departments-preview-heading">
              <CompanySectionHeader id="departments-preview-heading" title="Departments" href="/company/departments" />
              <DepartmentList departments={departments} compact />
            </section>
            <section aria-labelledby="locations-preview-heading">
              <CompanySectionHeader id="locations-preview-heading" title="Locations" href="/company/locations" />
              <LocationList locations={locations} compact />
            </section>
          </>
        )}
      </CompanyContent>
    </CompanyPageShell>
  )
}
