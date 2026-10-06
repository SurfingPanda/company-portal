import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** Skeleton shaped like the profile page. */
export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" aria-busy="true" className="space-y-8">
      <span className="sr-only">Loading profile…</span>
      <div className="flex items-center gap-5 border bg-white p-6">
        <Skeleton className="size-20 rounded-sm" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded-sm" />
          <Skeleton className="h-4 w-40 rounded-sm" />
          <Skeleton className="h-4 w-32 rounded-sm" />
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-sm" />
        <Skeleton className="h-52 rounded-sm" />
      </div>
    </div>
  )
}

export function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-destructive/30 bg-white px-6 py-12 text-center" role="alert">
      <h2 className="font-serif text-xl font-semibold text-primary">We couldn&apos;t load your profile.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Official employee information is temporarily unavailable. Please try again.</p>
      <Button className="mt-5" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
