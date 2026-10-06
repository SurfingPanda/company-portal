import { Button } from '@/components/ui/button'

/** Shown when no events match. Pass `onClear` when filters are active. */
export function EventEmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-serif text-xl font-semibold text-primary">No events found</h2>
      <p className="mt-2 text-sm text-muted-foreground">There are no events matching your current filters.</p>
      {onClear && (
        <Button variant="outline" className="mt-5 bg-white" onClick={onClear}>
          Clear Filters
        </Button>
      )}
    </div>
  )
}
