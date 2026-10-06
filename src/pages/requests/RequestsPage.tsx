import { Info } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { FormErrorState, RequestListSkeleton } from '@/components/forms/FormStates'
import { SubmittedRequestsTable } from '@/components/forms/SubmittedRequestsTable'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { getRequestCategory } from '@/data/requestCategories'
import { getRequests } from '@/services/requestService'

export default function RequestsPage() {
  const [params] = useSearchParams()
  const category = getRequestCategory(params.get('category') ?? '')
  const { data: all, error, retry } = useAsync(getRequests, [])
  const data = category ? all?.filter((r) => r.category === category.id) : all

  let content
  if (error) {
    content = <FormErrorState title="Unable to load requests" onRetry={retry} />
  } else if (!data) {
    content = <RequestListSkeleton />
  } else if (data.length === 0) {
    content = (
      <div className="border bg-white px-6 py-12 text-center" role="status">
        <h2 className="font-serif text-xl font-semibold text-primary">{category ? `No ${category.label} requests yet` : 'No requests yet'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">You have not submitted any requests through the Employee Portal.</p>
        <Button asChild className="mt-5">
          <Link to="/forms">Browse Forms &amp; Requests</Link>
        </Button>
      </div>
    )
  } else {
    content = <SubmittedRequestsTable requests={data} />
  }

  return (
    <PageContainer className="pb-16">
      <PageHeader
        title="My Requests"
        description="View the status of requests you have submitted through the Employee Portal."
        breadcrumbs={[{ label: 'My Requests' }]}
        actions={
          <Button asChild variant="outline" className="bg-white">
            <Link to="/forms">New Request</Link>
          </Button>
        }
      />
      <div role="note" className="mt-6 flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-foreground/80">
          <span className="font-semibold text-foreground">Sample requests.</span> These are development examples. Requests you submit in
          this prototype are kept in this browser session only and are not sent to a server.
        </p>
      </div>
      {category && (
        <p className="mt-6 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{category.label}</span> requests.
          <Link to="/requests" className="text-primary underline-offset-4 hover:underline">
            Show all requests
          </Link>
        </p>
      )}
      <div className="mt-6">{content}</div>
    </PageContainer>
  )
}
