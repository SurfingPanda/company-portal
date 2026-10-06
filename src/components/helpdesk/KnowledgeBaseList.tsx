import { KnowledgeBaseCard } from '@/components/helpdesk/KnowledgeBaseCard'
import { Button } from '@/components/ui/button'
import type { KnowledgeBaseArticle } from '@/types/knowledgeBase'
import { Link } from 'react-router-dom'

export function KnowledgeBaseList({ articles, onClear }: { articles: KnowledgeBaseArticle[]; onClear?: () => void }) {
  if (articles.length === 0) {
    return (
      <div className="border bg-white px-6 py-12 text-center" role="status">
        <h2 className="font-serif text-xl font-semibold text-primary">No articles found</h2>
        <p className="mt-2 text-sm text-muted-foreground">Try a different search, or submit a request and IT will help.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onClear && (
            <Button variant="outline" className="bg-white" onClick={onClear}>
              Clear Search
            </Button>
          )}
          <Button asChild>
            <Link to="/helpdesk/new">Submit a Request</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ul aria-label="Knowledge-base articles" className="grid gap-4 md:grid-cols-2">
      {articles.map((a) => (
        <li key={a.id}>
          <KnowledgeBaseCard article={a} />
        </li>
      ))}
    </ul>
  )
}
