import { useEffect } from 'react'
import { ArrowLeft, Paperclip } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AnnouncementCategoryBadge } from '@/components/announcements/AnnouncementCategoryBadge'
import { AnnouncementMeta } from '@/components/announcements/AnnouncementMeta'
import { AnnouncementPriority } from '@/components/announcements/AnnouncementPriority'
import { AnnouncementRelatedResources } from '@/components/announcements/AnnouncementRelatedResources'
import { AnnouncementErrorState, SampleAnnouncementsNotice } from '@/components/announcements/AnnouncementStates'
import { ContentBlocks } from '@/components/common/ContentBlocks'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/context/NotificationContext'
import { useAsync } from '@/hooks/useAsync'
import { getAnnouncement, getRelatedResources, markAnnouncementRead } from '@/services/announcementService'
import type { Announcement } from '@/types/announcement'

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading announcement" className="space-y-4">
      <Skeleton className="h-6 w-40 rounded-sm" />
      <Skeleton className="h-10 w-3/4 rounded-sm" />
      <Skeleton className="h-64 rounded-sm" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Announcement Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The announcement you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/announcements">
          <ArrowLeft aria-hidden="true" /> Back to Announcements
        </Link>
      </Button>
    </div>
  )
}

function AnnouncementDetail({ announcement }: { announcement: Announcement }) {
  const { notifications, markAsRead } = useNotifications()
  const { data: related } = useAsync(() => getRelatedResources(announcement), [announcement.id])

  // Opening an announcement marks it read, and marks any Phase 9 notification that points at it as read.
  // Notification state stays in NotificationContext; announcement read state stays in the announcement service.
  useEffect(() => {
    void markAnnouncementRead(announcement.id)
  }, [announcement.id])

  // Re-runs when notifications finish loading, so a direct visit still clears the matching notification.
  useEffect(() => {
    notifications.filter((n) => n.type === 'announcement' && n.relatedId === announcement.id && !n.isRead).forEach((n) => markAsRead(n.id))
  }, [announcement.id, notifications, markAsRead])

  return (
    <article className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <header className="border-b-2 border-primary pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <AnnouncementCategoryBadge category={announcement.category} />
            <AnnouncementPriority priority={announcement.priority} showNormal />
            {announcement.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-primary">{announcement.title}</h1>
          <AnnouncementMeta announcement={announcement} dateStyle="long" className="mt-3 text-sm" />
        </header>

        <div className="mt-6">
          <ContentBlocks blocks={announcement.content} />
        </div>

        {announcement.tags && announcement.tags.length > 0 && <p className="mt-6 text-xs text-muted-foreground">Tags: {announcement.tags.join(', ')}</p>}

        <div className="mt-8">
          <Button asChild variant="outline" className="bg-white">
            <Link to="/announcements">
              <ArrowLeft aria-hidden="true" /> Back to Announcements
            </Link>
          </Button>
        </div>
      </div>

      <aside className="space-y-8">
        {related && <AnnouncementRelatedResources resources={related} />}

        {announcement.attachments && announcement.attachments.length > 0 && (
          <section aria-labelledby="attachments-heading">
            <h2 id="attachments-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
              Attachments
            </h2>
            <ul className="bg-white ring-1 ring-border">
              {announcement.attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 px-4 py-3 text-sm">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.fileType}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Sample attachment (mock). No file is attached or downloadable yet.</p>
          </section>
        )}

        <section aria-labelledby="audience-heading">
          <h2 id="audience-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
            Applies To
          </h2>
          <p className="mt-3 text-sm text-foreground/85">
            {announcement.audience === 'department' ? `${announcement.department ?? 'A specific'} department` : 'All employees'}
          </p>
        </section>
      </aside>
    </article>
  )
}

export default function AnnouncementDetailPage() {
  const { announcementId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getAnnouncement(announcementId), [announcementId])

  const trail = [{ label: 'Announcements', href: '/announcements' }, { label: data ? data.title : loading ? 'Loading…' : 'Not found' }]

  let content
  if (error) content = <AnnouncementErrorState title="We couldn't load this announcement." onRetry={retry} />
  else if (loading && !data) content = <DetailSkeleton />
  else if (!data) content = <NotFound />
  else content = <AnnouncementDetail key={data.id} announcement={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {data && <SampleAnnouncementsNotice className="mb-6" />}
      {content}
    </PageContainer>
  )
}
