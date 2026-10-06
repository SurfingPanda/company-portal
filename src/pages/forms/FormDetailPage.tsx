import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, Eye, Info } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { kindMeta } from '@/components/forms/formMeta'
import { FormErrorState } from '@/components/forms/FormStates'
import { RequestForm } from '@/components/forms/RequestForm'
import { RequestSuccess } from '@/components/forms/RequestSuccess'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/context/NotificationContext'
import { getRequestCategoryLabel } from '@/data/requestCategories'
import { getSubmissionCopy } from '@/data/requestTypes'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/format'
import { getDocument } from '@/services/documentService'
import { addActivity } from '@/services/notificationService'
import { getFormDetail, type FormDetail } from '@/services/formService'
import type { EmployeeRequest, EmployeeRequestType } from '@/types/request'

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading form" className="space-y-6">
      <Skeleton className="h-28 rounded-sm" />
      <Skeleton className="h-64 rounded-sm" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Form Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The form or request you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/forms">
          <ArrowLeft aria-hidden="true" /> Back to Forms &amp; Requests
        </Link>
      </Button>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function InfoList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[8rem_1fr] gap-3 border-b border-border py-2.5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
          <dd className="text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Download-type form: connected to the Documents module through `documentId`. */
function DownloadActions({ documentId }: { documentId?: string }) {
  const [message, setMessage] = useState<string>()
  const { data: document } = useAsync(() => (documentId ? getDocument(documentId) : Promise.resolve(null)), [documentId])

  if (!documentId) {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-white" disabled>
            <Eye aria-hidden="true" /> View Document
          </Button>
          <Button disabled>
            <Download aria-hidden="true" /> Download Form
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">No document is linked to this form yet.</p>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="bg-white">
          <Link to={`/documents/${documentId}`}>
            <Eye aria-hidden="true" /> View Document
          </Link>
        </Button>
        <Button onClick={() => setMessage('Download: file download is not connected yet.')}>
          <Download aria-hidden="true" /> Download Form
        </Button>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm font-medium text-primary">
        {message}
      </p>
      {document && (
        <p className="text-xs text-muted-foreground">
          Documents record: {document.fileType}
          {document.fileSize ? ` · ${document.fileSize}` : ''}
          {document.version ? ` · Version ${document.version}` : ''} · Updated {formatDate(document.updatedAt)}
        </p>
      )}
    </>
  )
}

/** Online form or request type: shows requirements, then the reusable dynamic form after "Start Request". */
function OnlineRequest({ requestType }: { requestType: EmployeeRequestType }) {
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState<EmployeeRequest>()
  const formRef = useRef<HTMLDivElement>(null)
  const available = requestType.status === 'available'
  const { addNotification } = useNotifications()

  // Demonstrates request -> notification: in production the backend would create this when the request is stored.
  const handleSubmitted = (request: EmployeeRequest) => {
    setSubmitted(request)
    // Request types with their own copy (employee information, benefits) also add an activity entry. Same notification and activity systems.
    const copy = getSubmissionCopy(request.requestTypeId)
    if (copy) void addActivity({ action: copy.activity, description: request.reference, type: 'request', href: `/requests/${request.id}` })
    addNotification({
      title: copy?.title ?? 'Request Submitted',
      message: copy?.message ?? `Your ${request.requestTypeTitle} (${request.reference}) has been submitted.`,
      type: 'request',
      href: `/requests/${request.id}`,
      relatedId: request.id,
    })
  }

  useEffect(() => {
    if (started) formRef.current?.scrollIntoView({ block: 'start' })
  }, [started])

  return (
    <>
      <div>
        {requestType.route && available ? (
          // Request types with their own page (e.g. leave) open it instead of the generic form.
          <Button asChild>
            <Link to={requestType.route}>Start Request</Link>
          </Button>
        ) : (
          <Button disabled={!available || started} onClick={() => setStarted(true)}>
            {available ? 'Start Request' : 'Coming Soon'}
          </Button>
        )}
      </div>

      {started && (
        <div ref={formRef} className="scroll-mt-24 pt-2">
          {submitted ? (
            <RequestSuccess request={submitted} />
          ) : (
            <Section id="request-form-heading" title="Submit Request">
              <RequestForm requestType={requestType} onSubmitted={handleSubmitted} />
            </Section>
          )}
        </div>
      )}
    </>
  )
}

function FormDetailContent({ detail }: { detail: FormDetail }) {
  const form = detail.form
  const requestType = detail.requestType
  const isDownload = form?.type === 'download'
  const meta = isDownload ? kindMeta.download : form ? kindMeta.online : kindMeta.request
  const title = form?.title ?? requestType!.title
  const description = form?.description ?? requestType!.description
  const category = form?.category ?? requestType!.category
  const instructions = form?.instructions ?? requestType?.instructions ?? []
  const isSample = form?.isSample ?? requestType?.isSample

  const info = [
    { label: 'Form Type', value: meta.label },
    { label: 'Category', value: getRequestCategoryLabel(category) },
    ...(requestType
      ? [
          { label: 'Processing', value: requestType.estimatedProcessingTime ?? 'To be confirmed' },
          { label: 'Approval', value: requestType.requiresApproval ? 'Approval may be required (sample)' : 'Not specified' },
          { label: 'Attachment', value: requestType.requiresAttachment ? 'Required' : 'Optional' },
          { label: 'Status', value: requestType.status === 'available' ? 'Available' : 'Coming Soon' },
        ]
      : []),
  ]

  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-gold">{meta.label}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">{title}</h1>
          {isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </div>
        <p className="mt-1 max-w-2xl text-[0.9375rem] text-muted-foreground">{description}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Section id="instructions-heading" title="Instructions">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85">
              {instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
            <p className="mt-3 flex items-start gap-2 border border-dashed border-muted-foreground/40 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Sample instructions. Official instructions will be provided by the responsible department.
            </p>
          </Section>

          <Section id="actions-heading" title={isDownload ? 'Get the Form' : 'Start a Request'}>
            {isDownload ? <DownloadActions documentId={form?.documentId} /> : requestType ? <OnlineRequest requestType={requestType} /> : null}
          </Section>

          <Button asChild variant="outline" className="bg-white">
            <Link to="/forms">
              <ArrowLeft aria-hidden="true" /> Back to Forms &amp; Requests
            </Link>
          </Button>
        </div>

        <section aria-labelledby="form-info-heading">
          <h2 id="form-info-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
            Details
          </h2>
          <InfoList items={info} />
        </section>
      </div>
    </div>
  )
}

export default function FormDetailPage() {
  const { formId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getFormDetail(formId), [formId])

  const name = data ? (data.form?.title ?? data.requestType?.title ?? '') : loading ? 'Loading…' : 'Not found'
  const trail = [{ label: 'Forms & Requests', href: '/forms' }, { label: name }]

  let content
  if (error) content = <FormErrorState title="Unable to load this form" onRetry={retry} />
  else if (loading && !data) content = <DetailSkeleton />
  else if (!data) content = <NotFound />
  else content = <FormDetailContent key={formId} detail={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}
