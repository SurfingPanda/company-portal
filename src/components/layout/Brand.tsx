import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/common/Wordmark'

export function Brand() {
  return (
    <Link
      to="/"
      aria-label="Eljin Corp. Employee Portal, go to home"
      className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <Wordmark />
    </Link>
  )
}
