import { Link } from 'react-router-dom'
import { getKnowledgeBaseCategoryLabel } from '@/data/helpdeskOptions'
import { formatDate } from '@/lib/format'
import type { KnowledgeBaseArticle } from '@/types/knowledgeBase'

/** One knowledge-base article entry: category, title, summary and update date. */
export function KnowledgeBaseCard({ article }: { article: KnowledgeBaseArticle }) {
  return (
    <Link
      to={`/helpdesk/knowledge-base/${article.id}`}
      className="group block h-full border bg-white p-4 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="block text-[0.6875rem] font-semibold uppercase tracking-wider text-primary/80">{getKnowledgeBaseCategoryLabel(article.category)}</span>
      <span className="mt-1 block font-serif text-lg font-semibold leading-snug text-primary group-hover:underline">{article.title}</span>
      <span className="mt-1 block text-sm leading-snug text-foreground/75">{article.summary}</span>
      <span className="mt-2 block text-xs text-muted-foreground">Updated {formatDate(article.updatedAt)}</span>
    </Link>
  )
}
