import { Link } from 'react-router-dom'
import { HREmptyState, HRErrorState, HRListSkeleton, HRSection } from '@/components/hr/HRStates'
import { DocumentPreviewList } from '@/components/resources/DocumentPreviewList'
import { ResourceLinkList, ResourcesPageShell } from '@/components/resources/ResourcesPageShell'
import { companyLinks } from '@/data/resources'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/format'
import { getRecentAnnouncements } from '@/services/announcementService'

/** Latest announcements come from the Announcements module. */
function LatestAnnouncements() {
  const { data, error, retry } = useAsync(() => getRecentAnnouncements(4), [])
  if (error) return <HRErrorState onRetry={retry} />
  if (!data) return <HRListSkeleton rows={3} label="Loading announcements" />
  if (data.length === 0) return <HREmptyState title="No announcements" message="There are no announcements at this time." />
  return (
    <div>
      <ul aria-label="Latest announcements" className="divide-y border bg-white">
        {data.map((a) => (
          <li key={a.id}>
            <Link to={`/announcements/${a.id}`} className="block px-4 py-2.5 hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
              <span className="text-sm font-medium text-primary hover:underline">{a.title}</span>
              <span className="block text-xs text-muted-foreground">{formatDate(a.publishedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">
        <Link to="/announcements" className="font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline">
          All announcements →
        </Link>
      </p>
    </div>
  )
}

export default function CompanyResourcesPage() {
  return (
    <ResourcesPageShell title="Company Resources" description="Company information, news, calendar and documents." current="Company">
      <div className="space-y-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <HRSection id="co-res-links-heading" title="Company">
            <ResourceLinkList label="Company resources" links={companyLinks} />
          </HRSection>
          <HRSection id="co-res-news-heading" title="Company Announcements">
            <LatestAnnouncements />
          </HRSection>
        </div>
        <HRSection id="co-res-docs-heading" title="Company Documents">
          <DocumentPreviewList category="company" label="Company documents" viewAllHref="/documents?category=company" limit={5} />
        </HRSection>
      </div>
    </ResourcesPageShell>
  )
}
