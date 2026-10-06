import { SectionHeading } from '@/components/common/SectionHeading'
import { AnnouncementList } from '@/components/home/AnnouncementList'
import { SectionError } from '@/components/dashboard/SectionBoundary'
import { useAsync } from '@/hooks/useAsync'
import { getRecentAnnouncements } from '@/services/announcementService'

/** Latest announcements from the Announcements module, with a section-level error state. */
export function DashboardAnnouncements() {
  const { data, error, retry } = useAsync(() => getRecentAnnouncements(4), [])

  if (error) {
    return (
      <section aria-labelledby="announcements-heading">
        <SectionHeading id="announcements-heading" title="Company Announcements" />
        <SectionError onRetry={retry} />
      </section>
    )
  }
  return <AnnouncementList announcements={data} />
}
