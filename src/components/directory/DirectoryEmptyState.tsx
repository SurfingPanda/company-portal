import { Button } from '@/components/ui/button'

interface DirectoryEmptyStateProps {
  onClear: () => void
}

export function DirectoryEmptyState({ onClear }: DirectoryEmptyStateProps) {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-serif text-xl font-semibold text-primary">No employees found</h2>
      <p className="mt-2 text-sm text-foreground/80">We couldn&apos;t find an employee matching your search.</p>
      <p className="mt-1 text-sm text-muted-foreground">Try a different name, department, or position.</p>
      <Button variant="outline" className="mt-5 bg-white" onClick={onClear}>
        Clear Search
      </Button>
    </div>
  )
}
