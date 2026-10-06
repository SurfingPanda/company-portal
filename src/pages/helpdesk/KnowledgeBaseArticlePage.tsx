import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ContentBlocks } from '@/components/common/ContentBlocks'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { HelpdeskErrorState, SampleHelpdeskNotice } from '@/components/helpdesk/HelpdeskStates'
import { RelatedArticles } from '@/components/helpdesk/RelatedArticles'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getKnowledgeBaseCategoryLabel } from '@/data/helpdeskOptions'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/format'
import { getArticle, getRelatedArticles } from '@/services/helpdeskService'
import type { KnowledgeBaseArticle } from '@/types/knowledgeBase'

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Article Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The help article you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/helpdesk/knowledge-base">
          <ArrowLeft aria-hidden="true" /> Back to Knowledge Base
        </Link>
      </Button>
    </div>
  )
}

function ArticleDetail({ article }: { article: KnowledgeBaseArticle }) {
  const { data: related } = useAsync(() => getRelatedArticles(article), [article.id])

  return (
    <article className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <header className="border-b-2 border-primary pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-primary/80">{getKnowledgeBaseCategoryLabel(article.category)}</span>
            {article.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-primary">{article.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated <time dateTime={article.updatedAt}>{formatDate(article.updatedAt, 'long')}</time>
            {article.author && <span> · {article.author}</span>}
          </p>
        </header>

        <div className="mt-6">
          <ContentBlocks blocks={article.content} ordered />
        </div>

        <p className="mt-6 text-xs text-muted-foreground">Tags: {article.tags.join(', ')}</p>

        <section aria-labelledby="still-need-help-heading" className="mt-8 border border-l-4 border-l-primary bg-white p-5">
          <h2 id="still-need-help-heading" className="font-serif text-lg font-semibold text-primary">
            Still need help?
          </h2>
          <Button asChild size="sm" className="mt-3">
            <Link to="/helpdesk/new">Submit an IT Support Request</Link>
          </Button>
        </section>

        <div className="mt-8">
          <Button asChild variant="outline" className="bg-white">
            <Link to="/helpdesk/knowledge-base">
              <ArrowLeft aria-hidden="true" /> Back to Knowledge Base
            </Link>
          </Button>
        </div>
      </div>

      <aside>{related && <RelatedArticles articles={related} />}</aside>
    </article>
  )
}

export default function KnowledgeBaseArticlePage() {
  const { articleId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getArticle(articleId), [articleId])

  const trail = [{ label: 'IT Helpdesk', href: '/helpdesk' }, { label: 'Knowledge Base', href: '/helpdesk/knowledge-base' }, { label: data ? data.title : loading ? 'Loading…' : 'Not found' }]

  let content
  if (error) content = <HelpdeskErrorState onRetry={retry} />
  else if (loading && !data) content = <Skeleton className="h-80 rounded-sm" />
  else if (!data) content = <NotFound />
  else content = <ArticleDetail key={data.id} article={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {data && <SampleHelpdeskNotice className="mb-6" text="This article is generic sample guidance, not an official Eljin procedure." />}
      {content}
    </PageContainer>
  )
}
