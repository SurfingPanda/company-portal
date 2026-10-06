import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CalendarView = 'month' | 'week' | 'list'

const views: { id: CalendarView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'list', label: 'List' },
]

interface CalendarToolbarProps {
  title: string
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarToolbar({ title, view, onViewChange, onPrevious, onNext, onToday }: CalendarToolbarProps) {
  const unit = view === 'week' ? 'week' : 'month'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-9 bg-white" onClick={onPrevious} aria-label={`Previous ${unit}`}>
          <ChevronLeft />
        </Button>
        <h2 aria-live="polite" className="min-w-40 px-2 text-center font-serif text-xl font-semibold text-primary sm:min-w-52">
          {title}
        </h2>
        <Button variant="outline" size="icon" className="size-9 bg-white" onClick={onNext} aria-label={`Next ${unit}`}>
          <ChevronRight />
        </Button>
        <Button variant="outline" className="ml-2 h-9 bg-white" onClick={onToday}>
          Today
        </Button>
      </div>

      <div role="group" aria-label="Calendar view" className="flex">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => onViewChange(v.id)}
            className={cn(
              'h-9 border px-4 text-sm font-medium transition-colors first:rounded-l-sm last:rounded-r-sm [&:not(:first-child)]:-ml-px focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              view === v.id ? 'z-[1] border-primary bg-primary text-primary-foreground' : 'bg-white text-foreground hover:bg-accent',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
