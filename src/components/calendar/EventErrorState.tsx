import { Button } from '@/components/ui/button'

export function EventErrorState({ title = 'Unable to load calendar events', onRetry }: { title?: string; onRetry: () => void }) {
  return (
    <div className="border border-destructive/30 bg-white px-6 py-12 text-center" role="alert">
      <h2 className="font-serif text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again later.</p>
      <Button className="mt-5" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
