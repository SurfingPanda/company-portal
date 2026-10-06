import { ArrowLeft, Paperclip } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { FormErrorState, RequestDetailSkeleton } from '@/components/forms/FormStates'
import { RequestStatus } from '@/components/forms/RequestStatus'
import { RequestTimeline } from '@/components/forms/RequestTimeline'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { getRequestCategoryLabel } from '@/data/requestCategories'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { formatDate, formatDateTime } from '@/lib/format'
import { cancelRequest, getRequest } from '@/services/requestService'
import type { EmployeeRequest } from '@/types/request'

const headingClass = 'border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary'

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Request Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The request you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/requests">
          <ArrowLeft aria-hidden="true" /> Back to My Requests
        </Link>
      </Button>
    </div>
  )
}

const CANCELLABLE: EmployeeRequest['status'][] = ['draft', 'submitted', 'under-review']

function RequestDetail({ request: initial }: { request: EmployeeRequest }) {
  const [request, setRequest] = useState(initial)
  const cancel = useMutation(cancelRequest)
  const handleCancel = async () => {
    if (!window.confirm('Cancel this request? This cannot be undone.')) return
    const updated = await cancel.mutate(request.id)
    if (updated) setRequest((prev) => ({ ...updated, isSample: prev.isSample, attachments: prev.attachments, answers: prev.answers, values: prev.values }))
  }

  const info: { label: string; value: React.ReactNode }[] = [
    { label: 'Reference', value: <span className="font-mono">{request.reference}</span> },
    { label: 'Request Type', value: request.requestTypeTitle },
    { label: 'Category', value: getRequestCategoryLabel(request.category) },
    { label: 'Submitted', value: formatDate(request.submittedAt, 'long') },
    { label: 'Status', value: <RequestStatus status={request.status} /> },
    { label: 'Last Updated', value: formatDateTime(request.updatedAt) },
    ...(request.assignedDepartment ? [{ label: 'Assigned To', value: request.assignedDepartment }] : []),
  ]

  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatus status={request.status} />
          {request.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-primary">{request.title}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{request.reference}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="submitted-info-heading">
            <h2 id="submitted-info-heading" className={headingClass}>
              Submitted Information
            </h2>
            <dl>
              <div className="grid grid-cols-[8rem_1fr] gap-3 border-b border-border py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</dt>
                <dd className="text-sm">{request.title}</dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-3 border-b border-border py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</dt>
                <dd className="text-sm">{request.description}</dd>
              </div>
              {request.answers.map((answer) => (
                <div key={answer.fieldId} className="grid grid-cols-[8rem_1fr] gap-3 border-b border-border py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{answer.label}</dt>
                  <dd className="whitespace-pre-line break-words text-sm">{answer.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="attachments-heading">
            <h2 id="attachments-heading" className={headingClass}>
              Attachments
            </h2>
            {request.attachments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No attachments.</p>
            ) : (
              <ul className="mt-3 divide-y border bg-white">
                {request.attachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                    <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate font-medium">{a.name}</span>
                    {a.size && <span className="shrink-0 text-xs text-muted-foreground">{a.size}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {cancel.error && (
            <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {cancel.error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="bg-white">
              <Link to="/requests">
                <ArrowLeft aria-hidden="true" /> Back to My Requests
              </Link>
            </Button>
            {CANCELLABLE.includes(request.status) && (
              <Button type="button" variant="outline" className="bg-white" onClick={handleCancel} disabled={cancel.submitting}>
                {cancel.submitting ? 'Cancelling…' : 'Cancel Request'}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section aria-labelledby="request-info-heading">
            <h2 id="request-info-heading" className={headingClass}>
              Request Information
            </h2>
            <dl>
              {info.map((item) => (
                <div key={item.label} className="grid grid-cols-[7rem_1fr] gap-3 border-b border-border py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
                  <dd className="text-sm">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="timeline-heading">
            <h2 id="timeline-heading" className={headingClass}>
              Request Timeline
            </h2>
            <div className="mt-4">
              <RequestTimeline entries={request.timeline} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function RequestDetailPage() {
  const { requestId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getRequest(requestId), [requestId])

  const trail = [{ label: 'My Requests', href: '/requests' }, { label: data ? data.reference : loading ? 'Loading…' : 'Not found' }]

  let content
  if (error) content = <FormErrorState title="Unable to load this request" onRetry={retry} />
  else if (loading && !data) content = <RequestDetailSkeleton />
  else if (!data) content = <NotFound />
  else content = <RequestDetail request={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}
