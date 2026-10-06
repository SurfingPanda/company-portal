import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { ApplicationForm } from '@/components/recruitment/ApplicationForm'
import { RecruitmentEmptyState, RecruitmentErrorState, RecruitmentNotice } from '@/components/recruitment/RecruitmentEmptyState'
import { SubmissionSuccess } from '@/components/recruitment/SubmissionSuccess'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RECRUITMENT_CONFIG } from '@/config/recruitment'
import { useNotifications } from '@/context/NotificationContext'
import { useAsync } from '@/hooks/useAsync'
import { canApply, getExternalApplicationUrl } from '@/lib/recruitment'
import { JobNotFound } from '@/pages/recruitment/JobDetailPage'
import { addActivity } from '@/services/notificationService'
import { getJob } from '@/services/recruitmentService'
import type { Application, JobOpening } from '@/types/recruitment'

function ApplyContent({ job }: { job: JobOpening }) {
  const [submitted, setSubmitted] = useState<Application>()
  const { addNotification } = useNotifications()
  const externalUrl = getExternalApplicationUrl(job)

  // Demonstrates application -> notification and activity: a real backend would create both when it stores the application.
  const handleSubmitted = (application: Application) => {
    setSubmitted(application)
    addNotification({
      title: 'Application submitted',
      message: `Your application for ${application.jobTitle} has been submitted.`,
      type: 'hr',
      href: `/recruitment/applications/${application.id}`,
      relatedId: application.id,
    })
    void addActivity({ action: 'Submitted a job application', description: `${application.jobTitle} (${application.reference})`, type: 'request', href: `/recruitment/applications/${application.id}` })
  }

  if (!canApply(job)) {
    return <RecruitmentEmptyState title="Applications not available" message="This position is not currently accepting applications." action={{ label: 'Back to Job Openings', to: '/recruitment/jobs' }} />
  }

  if (externalUrl) {
    const name = RECRUITMENT_CONFIG.externalRecruitmentSystemName || 'the recruitment system'
    return (
      <div className="border bg-white px-6 py-10 text-center">
        <h2 className="font-serif text-xl font-semibold text-primary">Apply through {name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Applications for this position are handled outside the portal.</p>
        <Button asChild className="mt-5">
          <a href={externalUrl} target="_blank" rel="noopener noreferrer">
            Continue to application <ExternalLink aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Button>
      </div>
    )
  }

  if (submitted) return <SubmissionSuccess kind="application" record={submitted} />

  return (
    <div className="space-y-6">
      <RecruitmentNotice strong="Demo application.">This is a demonstration of the application flow for a sample position. Nothing is sent to HR or a recruitment system.</RecruitmentNotice>
      <ApplicationForm job={job} onSubmitted={handleSubmitted} />
    </div>
  )
}

export default function ApplyPage() {
  const { jobId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getJob(jobId), [jobId])

  const trail = [
    { label: 'HR & Employee Services', href: '/hr' },
    { label: 'Recruitment & Careers', href: '/recruitment' },
    { label: 'Job Openings', href: '/recruitment/jobs' },
    ...(data ? [{ label: data.title, href: `/recruitment/jobs/${data.id}` }] : []),
    { label: 'Apply' },
  ]

  let content
  if (error) content = <RecruitmentErrorState title="Unable to load this position" onRetry={retry} />
  else if (loading && !data) content = <Skeleton role="status" aria-label="Loading application form" className="h-96 rounded-sm" />
  else if (!data) content = <JobNotFound />
  else
    content = (
      <>
        <header className="mb-6 border-b-2 border-primary pb-4">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">Apply: {data.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.department} · {data.location} ·{' '}
            <Link to={`/recruitment/jobs/${data.id}`} className="text-primary underline-offset-4 hover:underline">
              View position
            </Link>
          </p>
        </header>
        <ApplyContent key={data.id} job={data} />
      </>
    )

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      <div className="mx-auto max-w-3xl">{content}</div>
    </PageContainer>
  )
}
