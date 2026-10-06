import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { SearchInput } from '@/components/search/SearchInput'

const isDesktop = () => window.matchMedia('(min-width: 1280px)').matches
const isMac = () => typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

/**
 * Header search. Wide screens get an inline field with a Ctrl/Cmd+K hint; narrower screens get a search button that
 * opens a full-width field under the header. Submitting goes to /search?q=… . Ctrl/Cmd+K focuses or opens it anywhere.
 */
export function GlobalSearch() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const desktopRef = useRef<HTMLInputElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isDesktop()) {
          desktopRef.current?.focus()
          desktopRef.current?.select()
        } else {
          setOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const submit = (q: string) => {
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    setValue('')
    setOpen(false)
    desktopRef.current?.blur()
  }

  const close = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <>
      <SearchInput
        ref={desktopRef}
        id="global-search-desktop"
        value={value}
        onChange={setValue}
        onSubmit={submit}
        hint={isMac() ? '⌘ K' : 'Ctrl K'}
        className="hidden w-44 shrink-0 xl:flex 2xl:w-56"
      />

      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close search' : 'Search employee portal'}
        aria-expanded={open}
        aria-controls="global-search-panel"
        className="flex size-9 items-center justify-center text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring xl:hidden"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
      </button>

      {open && (
        <div
          id="global-search-panel"
          className="absolute inset-x-0 top-full z-40 border-b bg-white py-3 xl:hidden"
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
          }}
        >
          <PageContainer>
            <SearchInput id="global-search-mobile" value={value} onChange={setValue} onSubmit={submit} autoFocus showButton />
          </PageContainer>
        </div>
      )}
    </>
  )
}
