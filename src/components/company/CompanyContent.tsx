import type { ReactNode } from 'react'
import { DirectoryErrorState } from '@/components/directory/DirectoryErrorState'
import { Skeleton } from '@/components/ui/skeleton'

interface CompanyContentProps<T> {
  data: T | undefined
  error: Error | undefined
  onRetry: () => void
  children: (data: T) => ReactNode
}

/** Renders loading, error, then content for any company data request. */
export function CompanyContent<T>({ data, error, onRetry, children }: CompanyContentProps<T>) {
  if (error) return <DirectoryErrorState title="Unable to load company information." onRetry={onRetry} />
  if (data === undefined) {
    return (
      <div role="status" aria-label="Loading company information" className="space-y-3">
        <Skeleton className="h-6 w-1/3 rounded-sm" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-sm" />
        <Skeleton className="h-4 w-full max-w-xl rounded-sm" />
        <Skeleton className="h-32 w-full rounded-sm" />
      </div>
    )
  }
  return <>{children(data)}</>
}
