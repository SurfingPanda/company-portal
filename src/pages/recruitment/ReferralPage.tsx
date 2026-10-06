import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { RecruitmentEmptyState, RecruitmentErrorState, RecruitmentNotice } from '@/components/recruitment/RecruitmentEmptyState'
import { ReferralForm } from '@/components/recruitment/ReferralForm'
import { SubmissionSuccess } from '@/components/recruitment/SubmissionSuccess'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/context/NotificationContext'
import { useAsync } from '@/hooks/useAsync'
import { canRefer } from '@/lib/recruitment'
import { JobNotFound } from '@/pages/recruitment/JobDetailPage'
import { addActivity } from '@/services/notificationService'
import { getJob } from '@/services/recruitmentService'
import type { JobOpening, Referral } from '@/types/recruitment'

function ReferralContent({ job }: { job: JobOpening }) {
  const [submitted, setSubmitted] = useState<Referral>()
  const { addNotification } = useNotifications()

  const handleSubmitted = (referral: Referral) => {
    setSubmitted(referral)
    addNotification({ title: 'Referral submitted', message: `Your referral for ${referral.jobTitle} has been submitted.`, type: 'hr', relatedId: referral.id })
    void addActivity({ action: 'Submitted an employee referral', description: `${referral.jobTitle} (${referral.reference})`, type: 'request' })
  }

  if (!canRefer(job)) {
    return <RecruitmentEmptyState title="Referrals not available" message="This position is not currently accepting referrals." action={{ label: 'Back to Job Openings', to: '/recruitment/jobs' }} />
  }
  if (submitted) return <SubmissionSuccess kind="referral" record={submitted} />

  return (
    <div className="space-y-6">
      <RecruitmentNotice strong="Demo referral.">Referrals are not processed yet. Only refer someone who has agreed to share their details.</RecruitmentNotice>
      <ReferralForm job={job} onSubmitted={handleSubmitted} />
    </div>
  )
}

export default function ReferralPage() {
  const { jobId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getJob(jobId), [jobId])

  const trail = [
    { label: 'HR & Employee Services', href: '/hr' },
    { label: 'Recruitment & Careers', href: '/recruitment' },
    { label: 'Job Openings', href: '/recruitment/jobs' },
    ...(data ? [{ label: data.title, href: `/recruitment/jobs/${data.id}` }] : []),
    { label: 'Refer a Candidate' },
  ]

  let content
  if (error) content = <RecruitmentErrorState title="Unable to load this position" onRetry={retry} />
  else if (loading && !data) content = <Skeleton role="status" aria-label="Loading referral form" className="h-96 rounded-sm" />
  else if (!data) content = <JobNotFound />
  else
    content = (
      <>
        <header className="mb-6 border-b-2 border-primary pb-4">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">Refer a Candidate: {data.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.department} · {data.location} ·{' '}
            <Link to={`/recruitment/jobs/${data.id}`} className="text-primary underline-offset-4 hover:underline">
              View position
            </Link>
          </p>
        </header>
        <ReferralContent key={data.id} job={data} />
      </>
    )

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      <div className="mx-auto max-w-3xl">{content}</div>
    </PageContainer>
  )
}
