import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function SearchEmptyState() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-serif text-xl font-semibold text-primary">No results found</h2>
      <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t find anything matching your search.</p>
      <ul className="mx-auto mt-4 max-w-xs list-disc space-y-1 pl-5 text-left text-sm text-foreground/80">
        <li>Check the spelling</li>
        <li>Try fewer words</li>
        <li>Search a broader term</li>
        <li>Browse Employee Resources</li>
      </ul>
      <Button asChild className="mt-5">
        <Link to="/resources">Browse Employee Resources</Link>
      </Button>
    </div>
  )
}

/** For failures once search is served by an API. */
export function SearchErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-destructive/30 bg-white px-6 py-12 text-center" role="alert">
      <h2 className="font-serif text-xl font-semibold text-primary">Search is temporarily unavailable.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
      <Button className="mt-5" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
}

/** Compact skeleton rows. */
export function SearchLoadingState() {
  return (
    <div role="status" aria-label="Searching" aria-busy="true" className="divide-y border bg-white">
      <span className="sr-only">Searching…</span>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="space-y-2 px-4 py-3">
          <Skeleton className="h-4 w-64 max-w-full rounded-sm" />
          <Skeleton className="h-3 w-full max-w-md rounded-sm" />
        </div>
      ))}
    </div>
  )
}
