import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function AnnouncementSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div role="search">
      <label htmlFor="announcement-search" className="sr-only">
        Search announcements by title, summary, content, department, category or tag
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
        <Input
          id="announcement-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search announcements..."
          autoComplete="off"
          className="h-12 border-primary/40 bg-white pl-12 pr-11 text-base md:text-base [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
