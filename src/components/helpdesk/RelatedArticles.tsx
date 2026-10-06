import { Link } from 'react-router-dom'
import { getKnowledgeBaseCategoryLabel } from '@/data/helpdeskOptions'
import type { KnowledgeBaseArticle } from '@/types/knowledgeBase'

export function RelatedArticles({ articles }: { articles: KnowledgeBaseArticle[] }) {
  if (articles.length === 0) return null

  return (
    <section aria-labelledby="related-articles-heading">
      <h2 id="related-articles-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
        Related Articles
      </h2>
      <ul className="bg-white ring-1 ring-border">
        {articles.map((a) => (
          <li key={a.id} className="border-b border-border last:border-b-0">
            <Link to={`/helpdesk/knowledge-base/${a.id}`} className="block px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
              <span className="block text-sm font-semibold text-primary">{a.title}</span>
              <span className="block text-xs text-muted-foreground">{getKnowledgeBaseCategoryLabel(a.category)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
