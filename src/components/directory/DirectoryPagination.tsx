import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DirectoryPaginationProps {
  page: number
  lastPage: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
}

/** 1, 2, 3 … with ellipses when there are many pages. */
function getPageItems(page: number, lastPage: number): (number | 'gap')[] {
  if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1)
  const items: (number | 'gap')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(lastPage - 1, page + 1)
  if (start > 2) items.push('gap')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < lastPage - 1) items.push('gap')
  items.push(lastPage)
  return items
}

export function DirectoryPagination({ page, lastPage, total, perPage, onPageChange }: DirectoryPaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      {lastPage > 1 && (
        <nav aria-label="Directory pagination">
          <ul className="flex items-center gap-1">
            <li>
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
                <ChevronLeft aria-hidden="true" /> <span className="hidden sm:inline">Previous</span>
              </Button>
            </li>
            {getPageItems(page, lastPage).map((item, index) => (
              <li key={`${item}-${index}`}>
                {item === 'gap' ? (
                  <span aria-hidden="true" className="px-2 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    variant={item === page ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onPageChange(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? 'page' : undefined}
                    className={cn('min-w-8 px-2 tabular-nums')}
                  >
                    {item}
                  </Button>
                )}
              </li>
            ))}
            <li>
              <Button variant="ghost" size="sm" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)} aria-label="Next page">
                <span className="hidden sm:inline">Next</span> <ChevronRight aria-hidden="true" />
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}
