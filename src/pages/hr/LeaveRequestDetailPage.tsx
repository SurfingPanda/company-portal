import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { LeaveRequestDetail } from '@/components/hr/LeaveRequestDetail'
import { HRErrorState } from '@/components/hr/HRStates'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getLeaveRequest } from '@/services/hrService'

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Leave Request Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The leave request you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/hr/leave/requests">
          <ArrowLeft aria-hidden="true" /> Back to My Leave Requests
        </Link>
      </Button>
    </div>
  )
}

export default function LeaveRequestDetailPage() {
  const { requestId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getLeaveRequest(requestId), [requestId])

  const trail = [
    { label: 'HR & Employee Services', href: '/hr' },
    { label: 'Leave', href: '/hr/leave' },
    { label: 'My Leave Requests', href: '/hr/leave/requests' },
    { label: data ? data.reference : loading ? 'Loading…' : 'Not found' },
  ]

  let content
  if (error) content = <HRErrorState title="Unable to load this leave request" onRetry={retry} />
  else if (loading && !data) content = <Skeleton role="status" aria-label="Loading leave request" className="h-96 rounded-sm" />
  else if (!data) content = <NotFound />
  else content = <LeaveRequestDetail request={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}
