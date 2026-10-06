import { File, FileSpreadsheet, FileText, Presentation, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentFileType } from '@/types/document'

const icons: Record<DocumentFileType, LucideIcon> = {
  PDF: FileText,
  DOC: FileText,
  DOCX: FileText,
  XLS: FileSpreadsheet,
  XLSX: FileSpreadsheet,
  PPT: Presentation,
  PPTX: Presentation,
}

interface DocumentTypeIconProps {
  fileType: DocumentFileType
  className?: string
}

/** File-type icon in a small square. Type is never shown by icon alone: the extension is always labelled nearby. */
export function DocumentTypeIcon({ fileType, className }: DocumentTypeIconProps) {
  const Icon = icons[fileType] ?? File
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-9 shrink-0 items-center justify-center border bg-secondary text-primary', className)}
    >
      <Icon className="size-[18px]" strokeWidth={1.5} />
    </span>
  )
}

/** Plain text extension label, e.g. [PDF]. */
export function FileTypeBadge({ fileType, className }: DocumentTypeIconProps) {
  return (
    <span
      className={cn(
        'inline-block border px-1.5 py-px font-mono text-[0.6875rem] font-semibold tracking-wide text-primary',
        className,
      )}
    >
      {fileType}
    </span>
  )
}
