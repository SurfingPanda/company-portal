import { Button } from '@/components/ui/button'

interface DirectoryErrorStateProps {
  title?: string
  onRetry: () => void
}

/** Shown when a directory request fails. Pass the retry handler from the data hook. */
export function DirectoryErrorState({ title = 'Unable to load the employee directory.', onRetry }: DirectoryErrorStateProps) {
  return (
    <div className="border border-destructive/30 bg-white px-6 py-12 text-center" role="alert">
      <h2 className="font-serif text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
      <Button className="mt-5" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
}
