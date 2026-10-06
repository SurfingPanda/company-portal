/** A thin progress bar with a text alternative. */
export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-28 bg-muted" role="img" aria-label={`${percent}% done`}>
      <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  )
}
