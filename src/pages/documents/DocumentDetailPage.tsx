import { useState } from 'react'
import { ArrowLeft, Download, Eye, Info } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AccessLabel } from '@/components/documents/AccessLabel'
import { DocumentCompactList } from '@/components/documents/DocumentCompactList'
import { DocumentErrorState } from '@/components/documents/DocumentErrorState'
import { DocumentTypeIcon, FileTypeBadge } from '@/components/documents/DocumentTypeIcon'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryInfo } from '@/data/documentCategories'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/format'
import { getDocument, getRelatedDocuments } from '@/services/documentService'
import { getFormByDocumentId } from '@/services/formService'
import type { DocumentResource } from '@/types/document'

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading document" className="space-y-6">
      <div className="flex gap-4 border bg-white p-6">
        <Skeleton className="size-14 rounded-sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-72 max-w-full rounded-sm" />
          <Skeleton className="h-4 w-64 max-w-full rounded-sm" />
        </div>
      </div>
      <Skeleton className="h-40 rounded-sm" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Document Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The document you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/documents">
          <ArrowLeft aria-hidden="true" /> Back to Documents
        </Link>
      </Button>
    </div>
  )
}

/** If this document is the file behind a form, link back to that form in Forms & Requests. */
function RelatedForm({ documentId }: { documentId: string }) {
  const { data: form } = useAsync(() => getFormByDocumentId(documentId), [documentId])
  if (!form) return null
  return (
    <p className="border bg-white px-4 py-3 text-sm">
      This document is used by the form{' '}
      <Link to={`/forms/${form.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
        {form.title}
      </Link>{' '}
      in Forms &amp; Requests.
    </p>
  )
}

function RelatedDocuments({ document }: { document: DocumentResource }) {
  const { data } = useAsync(() => getRelatedDocuments(document), [document.id])
  if (!data || data.length === 0) return null
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
        Related Documents
      </h2>
      <div className="mt-4">
        <DocumentCompactList documents={data} label="Related documents" />
      </div>
    </section>
  )
}

function DocumentDetail({ document }: { document: DocumentResource }) {
  const [action, setAction] = useState<string>()
  const category = getCategoryInfo(document.category)

  const info: { label: string; value: string }[] = [
    { label: 'File Type', value: document.fileType },
    { label: 'Category', value: category?.label ?? document.category },
    { label: 'Department', value: document.department },
    { label: 'Version', value: document.version ?? 'Not specified' },
    { label: 'Last Updated', value: formatDate(document.updatedAt, 'long') },
    { label: 'Date Added', value: formatDate(document.createdAt, 'long') },
    { label: 'Owner', value: document.owner ?? document.department },
    ...(document.fileSize ? [{ label: 'File Size', value: document.fileSize }] : []),
  ]

  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <DocumentTypeIcon fileType={document.fileType} className="size-14 [&_svg]:size-6" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">{document.title}</h1>
              {document.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/80">
              <span>{category?.label}</span>
              <span aria-hidden="true">·</span>
              <span>{document.department}</span>
              <span aria-hidden="true">·</span>
              <FileTypeBadge fileType={document.fileType} />
              <span aria-hidden="true">·</span>
              <span>Updated {formatDate(document.updatedAt, 'long')}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="bg-white" onClick={() => setAction(`View Document: file preview for "${document.title}" is not connected yet.`)}>
              <Eye aria-hidden="true" /> View Document
            </Button>
            <Button onClick={() => setAction(`Download: file download for "${document.title}" is not connected yet.`)}>
              <Download aria-hidden="true" /> Download
            </Button>
          </div>
        </div>
        <p role="status" className="mt-4 min-h-5 text-sm font-medium text-primary">
          {action}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
              Description
            </h2>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-foreground/85">{document.description}</p>
            {document.tags.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Tags: {document.tags.join(', ')}
              </p>
            )}
          </section>

          <section aria-labelledby="storage-note-heading" className="flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <h2 id="storage-note-heading" className="font-semibold text-foreground">
                File access not connected
              </h2>
              <p className="mt-0.5 text-foreground/80">
                This is a sample record. The actual file storage and download system will be connected to Laravel in a later phase.
              </p>
            </div>
          </section>

          <RelatedForm documentId={document.id} />
          <RelatedDocuments document={document} />
        </div>

        <section aria-labelledby="info-heading">
          <h2 id="info-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
            Document Information
          </h2>
          <dl>
            {info.map((item) => (
              <div key={item.label} className="grid grid-cols-[7rem_1fr] gap-3 border-b border-border py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
                <dd className="text-sm text-foreground">{item.value}</dd>
              </div>
            ))}
            <div className="grid grid-cols-[7rem_1fr] gap-3 border-b border-border py-2.5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access</dt>
              <dd>
                <AccessLabel level={document.accessLevel} showAll />
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

export default function DocumentDetailPage() {
  const { documentId = '' } = useParams()
  const { data: document, error, loading, retry } = useAsync(() => getDocument(documentId), [documentId])

  const trail = [{ label: 'Documents', href: '/documents' }, { label: document ? document.title : loading ? 'Loading…' : 'Not found' }]

  let content
  if (error) content = <DocumentErrorState title="Unable to load this document" onRetry={retry} />
  else if (loading && !document) content = <DetailSkeleton />
  else if (!document) content = <NotFound />
  else content = <DocumentDetail document={document} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}
