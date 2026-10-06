import { ArrowLeft, Paperclip } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { RequestTimeline } from '@/components/forms/RequestTimeline'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { ApplicationStatus } from '@/components/recruitment/ApplicationStatus'
import { RecruitmentErrorState, RecruitmentNotice } from '@/components/recruitment/RecruitmentEmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatDateTime } from '@/lib/format'
import { getApplication } from '@/services/recruitmentService'
import type { Application } from '@/types/recruitment'

const headingClass = 'border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary'

function Rows({ items, labelWidth = '8rem' }: { items: { label: string; value: React.ReactNode }[]; labelWidth?: string }) {
  return (
    <dl>
      {items.map((item) => (
        <div key={item.label} className="grid gap-3 border-b border-border py-2.5" style={{ gridTemplateColumns: `${labelWidth} 1fr` }}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 whitespace-pre-line break-words text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Application Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The application you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/recruitment/applications">
          <ArrowLeft aria-hidden="true" /> Back to My Applications
        </Link>
      </Button>
    </div>
  )
}

function Detail({ application: a }: { application: Application }) {
  const info = [
    { label: 'Reference', value: <span className="font-mono">{a.reference}</span> },
    { label: 'Position', value: <Link to={`/recruitment/jobs/${a.jobId}`} className="font-medium text-primary underline-offset-4 hover:underline">{a.jobTitle}</Link> },
    { label: 'Department', value: a.department },
    { label: 'Submitted', value: a.submittedAt ? formatDate(a.submittedAt, 'long') : 'Not yet submitted' },
    { label: 'Status', value: <ApplicationStatus status={a.status} /> },
    { label: 'Last Updated', value: formatDateTime(a.updatedAt) },
  ]
  const candidate = [
    { label: 'Full Name', value: a.applicant.fullName },
    { label: 'Email', value: a.applicant.email },
    { label: 'Mobile', value: a.applicant.mobile },
    { label: 'Experience', value: a.yearsOfExperience ? `${a.yearsOfExperience} years` : 'Not provided' },
    { label: 'Skills', value: a.skills ?? 'Not provided' },
    { label: 'Cover Letter', value: a.coverLetter ?? 'Not provided' },
  ]

  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <ApplicationStatus status={a.status} />
          {a.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-primary">{a.jobTitle}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{a.reference}</p>
      </header>

      <RecruitmentNotice strong="Demo data.">Application stages are examples only and do not describe an official ELJIN process. Tracking is not connected to a recruitment system.</RecruitmentNotice>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <section aria-labelledby="app-info-heading">
            <h2 id="app-info-heading" className={headingClass}>
              Application Information
            </h2>
            <Rows items={info} />
          </section>

          <section aria-labelledby="app-candidate-heading">
            <h2 id="app-candidate-heading" className={headingClass}>
              Candidate Information
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">Only the information you submitted through this portal.</p>
            <Rows items={candidate} />
          </section>

          <section aria-labelledby="app-resume-heading">
            <h2 id="app-resume-heading" className={headingClass}>
              Resume
            </h2>
            {a.resume ? (
              <ul className="mt-3 divide-y border bg-white">
                <li className="flex items-center gap-2 px-3 py-2.5 text-sm">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate font-medium">{a.resume.name}</span>
                  {a.resume.size && <span className="shrink-0 text-xs text-muted-foreground">{a.resume.size}</span>}
                </li>
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No resume attached.</p>
            )}
          </section>

          <Button asChild variant="outline" className="bg-white">
            <Link to="/recruitment/applications">
              <ArrowLeft aria-hidden="true" /> Back to My Applications
            </Link>
          </Button>
        </div>

        <section aria-labelledby="app-timeline-heading" className="min-w-0">
          <h2 id="app-timeline-heading" className={headingClass}>
            Application Timeline
          </h2>
          <div className="mt-4">
            <RequestTimeline entries={a.timeline} />
          </div>
        </section>
      </div>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { applicationId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getApplication(applicationId), [applicationId])

  const trail = [
    { label: 'HR & Employee Services', href: '/hr' },
    { label: 'Recruitment & Careers', href: '/recruitment' },
    { label: 'My Applications', href: '/recruitment/applications' },
    { label: data ? data.reference : loading ? 'Loading…' : 'Not found' },
  ]

  let content
  if (error) content = <RecruitmentErrorState title="Unable to load this application" onRetry={retry} />
  else if (loading && !data) content = <Skeleton role="status" aria-label="Loading application" className="h-96 rounded-sm" />
  else if (!data) content = <NotFound />
  else content = <Detail application={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}
