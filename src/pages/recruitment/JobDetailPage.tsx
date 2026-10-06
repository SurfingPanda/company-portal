import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { JobDetail } from '@/components/recruitment/JobDetail'
import { RecruitmentErrorState } from '@/components/recruitment/RecruitmentEmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getJob } from '@/services/recruitmentService'

export function JobNotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Position Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The position you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/recruitment/jobs">
          <ArrowLeft aria-hidden="true" /> Back to Jobs
        </Link>
      </Button>
    </div>
  )
}

export default function JobDetailPage() {
  const { jobId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getJob(jobId), [jobId])

  const trail = [
    { label: 'HR & Employee Services', href: '/hr' },
    { label: 'Recruitment & Careers', href: '/recruitment' },
    { label: 'Job Openings', href: '/recruitment/jobs' },
    { label: data ? data.title : loading ? 'Loading…' : 'Not found' },
  ]

  let content
  if (error) content = <RecruitmentErrorState title="Unable to load this position" onRetry={retry} />
  else if (loading && !data) content = <Skeleton role="status" aria-label="Loading position" className="h-96 rounded-sm" />
  else if (!data) content = <JobNotFound />
  else content = <JobDetail key={data.id} job={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}
