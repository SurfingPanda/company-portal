import { History } from 'lucide-react'

/** Sample suggestions, not usage statistics. Each is just a phrase that searches the portal. */
export const suggestedSearches = ['Employee Forms', 'Benefits', 'IT Helpdesk', 'Employee Handbook', 'HR Services', 'Company Calendar']

interface SearchSuggestionsProps {
  recent: string[]
  onPick: (query: string) => void
  onClearRecent: () => void
}

const chip = 'border bg-white px-3 py-1.5 text-sm text-primary hover:border-primary/50 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Shown while the search box is empty: recent searches (this browser only) and suggested searches. */
export function SearchSuggestions({ recent, onPick, onClearRecent }: SearchSuggestionsProps) {
  return (
    <div className="space-y-8">
      {recent.length > 0 && (
        <section aria-labelledby="recent-searches-heading">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-primary pb-1.5">
            <h2 id="recent-searches-heading" className="font-serif text-lg font-semibold text-primary">
              Recent searches
            </h2>
            <button type="button" onClick={onClearRecent} className="text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
              Clear recent searches
            </button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {recent.map((q) => (
              <li key={q}>
                <button type="button" className={`${chip} inline-flex items-center gap-1.5`} onClick={() => onPick(q)}>
                  <History className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="suggested-searches-heading">
        <h2 id="suggested-searches-heading" className="border-b-2 border-primary pb-1.5 font-serif text-lg font-semibold text-primary">
          Suggested searches
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {suggestedSearches.map((q) => (
            <li key={q}>
              <button type="button" className={chip} onClick={() => onPick(q)}>
                {q}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Suggestions are examples to get you started.</p>
      </section>
    </div>
  )
}
