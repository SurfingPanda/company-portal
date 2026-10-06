import type { FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface HelpdeskSearchProps {
  value: string
  onChange: (value: string) => void
  /** Called on Enter / form submit (e.g. to open the knowledge base with the query). */
  onSubmit?: () => void
  placeholder?: string
  label?: string
  id?: string
}

/** Reusable support search field. Controlled; live-filtering pages and submit-to-navigate pages both use it. */
export function HelpdeskSearch({ value, onChange, onSubmit, placeholder = 'How can we help?', label = 'Search IT help topics', id = 'helpdesk-search' }: HelpdeskSearchProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit?.()
  }

  return (
    <form role="search" onSubmit={handleSubmit}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
        <Input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
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
    </form>
  )
}
