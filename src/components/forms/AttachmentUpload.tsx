import { UPLOAD_NOTE } from '@/lib/uploadNotice'
import { useRef, useState, type DragEvent } from 'react'
import { Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AttachmentUploadProps {
  file: File | null
  onChange: (file: File | null) => void
  required?: boolean
  error?: string
  /** Replaces the default help line (e.g. to state a different size limit). */
  help?: string
  /** Field label (default "Attachment"). */
  label?: string
  /** Native file filter, e.g. ".pdf,.doc,.docx". */
  accept?: string
}

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`)

/**
 * File picker with drag and drop. The file is only held in the browser: it is not uploaded anywhere.
 * (A later phase will send it to POST /api/requests/{id}/attachments.)
 */
export function AttachmentUpload({ file, onChange, required, error, help, label = "Attachment", accept }: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = (list: FileList | null) => {
    const next = list?.[0]
    if (next) onChange(next)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files)
  }

  const errorId = 'rf-attachment-error'

  return (
    <div>
      <p id="rf-attachment-label" className="mb-1.5 text-sm font-medium text-foreground">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-0.5 text-destructive">*</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn('border border-dashed bg-white p-4', dragging && 'border-primary bg-accent', error && 'border-destructive')}
      >
        <input
          ref={inputRef}
          id="rf-attachment-input"
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files)
            e.target.value = ''
          }}
          aria-labelledby="rf-attachment-label"
          aria-describedby={error ? errorId : 'rf-attachment-help'}
          tabIndex={-1}
        />

        {file ? (
          <div className="flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate font-medium">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size)}</span>
            </p>
            <Button type="button" variant="outline" size="sm" className="shrink-0 bg-white" onClick={() => onChange(null)} aria-label={`Remove ${file.name}`}>
              <X aria-hidden="true" /> Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Drag and drop a file here
              <span className="mx-1.5">or</span>
            </p>
            <Button id="rf-attachment" type="button" variant="outline" size="sm" className="bg-white" onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
          </div>
        )}
      </div>

      <p id="rf-attachment-help" className="mt-1 text-xs text-muted-foreground">
        {help ?? `Maximum 5 MB. ${UPLOAD_NOTE}`}
      </p>
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-destructive">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  )
}
