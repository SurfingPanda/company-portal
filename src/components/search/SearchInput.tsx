import { forwardRef, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  id: string
  label?: string
  placeholder?: string
  /** "large" for the search page, "compact" for the header and Home. */
  size?: 'large' | 'compact'
  /** Show a visible Search button (the search page). */
  showButton?: boolean
  /** Small keyboard hint inside the field, e.g. "Ctrl K". */
  hint?: string
  autoFocus?: boolean
  className?: string
}

/** Accessible search form: labelled input, clear button, Enter or button submits. Used by the header, Home and the search page. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onSubmit, id, label = 'Search employee portal', placeholder = 'Search employee portal...', size = 'compact', showButton = false, hint, autoFocus, className },
  ref,
) {
  const large = size === 'large'
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(value.trim())
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('flex items-stretch gap-2', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative min-w-0 flex-1">
        <Search className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-primary', large ? 'left-4 size-5' : 'left-3 size-4')} aria-hidden="true" />
        <Input
          ref={ref}
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          className={cn('bg-white [&::-webkit-search-cancel-button]:hidden', large ? 'h-12 border-primary/40 pl-12 pr-11 text-base md:text-base' : 'h-9 pl-9 pr-9 text-sm')}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('')
              document.getElementById(id)?.focus()
            }}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : (
          hint && (
            <kbd aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 border bg-secondary px-1.5 py-0.5 font-sans text-[0.625rem] text-muted-foreground xl:block">
              {hint}
            </kbd>
          )
        )}
      </div>
      {showButton && (
        <Button type="submit" className={large ? 'h-12 px-6' : undefined}>
          Search
        </Button>
      )}
    </form>
  )
})
