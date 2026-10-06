import { Button } from '@/components/ui/button'

export function DocumentEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-serif text-xl font-semibold text-primary">No documents found</h2>
      <p className="mt-2 text-sm text-muted-foreground">Try changing your search or filters.</p>
      <Button variant="outline" className="mt-5 bg-white" onClick={onClear}>
        Clear Filters
      </Button>
    </div>
  )
}
