import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/** Section-level error panel. One failing section shows this instead of breaking the whole dashboard. */
export function SectionError({ title = "We couldn't load this section.", onRetry }: { title?: string; onRetry: () => void }) {
  return (
    <div role="alert" className="border border-destructive/30 bg-white px-4 py-5 text-sm">
      <p className="font-semibold text-primary">{title}</p>
      <Button variant="outline" size="sm" className="mt-2 bg-white" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
}

interface State {
  failed: boolean
  attempt: number
}

/**
 * Error boundary for a dashboard section: if rendering throws, only this section is replaced by an error panel with
 * "Try Again". (Data-loading failures are handled by each section's own error state.)
 */
export class SectionBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, attempt: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true }
  }

  retry = () => this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }))

  render() {
    if (this.state.failed) return <SectionError onRetry={this.retry} />
    // Changing the key remounts the children on retry.
    return <div key={this.state.attempt}>{this.props.children}</div>
  }
}
