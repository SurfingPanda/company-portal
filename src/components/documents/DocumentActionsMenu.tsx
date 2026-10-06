import { useState } from 'react'
import { Check, Copy, Download, Eye, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DocumentResource } from '@/types/document'

/** "More actions" menu for a document row. Download is disabled until file storage exists. */
export function DocumentActionsMenu({ document }: { document: DocumentResource }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/documents/${document.id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be blocked; the detail page URL is still available from the address bar.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={`More actions for ${document.title}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to={`/documents/${document.id}`}>
            <Eye /> View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            void copyLink()
          }}
        >
          {copied ? <Check /> : <Copy />} {copied ? 'Link copied' : 'Copy link'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Download /> Download (not connected)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
