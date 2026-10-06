import { useState, type FormEvent } from 'react'
import { AttachmentUpload } from '@/components/forms/AttachmentUpload'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { REPLY_MAX, validateReply } from '@/lib/helpdeskValidation'
import { UPLOAD_NOTE } from '@/lib/uploadNotice'
import { cn } from '@/lib/utils'

interface TicketReplyFormProps {
  /** Called with a validated reply. The page keeps replies in local state (POST .../replies later). */
  onSend: (reply: { message: string; attachment?: { name: string; size: number }; file?: File }) => void
  /** True while the reply is being sent: disables the button so it cannot be sent twice. */
  sending?: boolean
  /** A safe error sentence from the last attempt. */
  error?: string | null
}

export function TicketReplyForm({ onSend, sending = false, error }: TicketReplyFormProps) {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<{ message?: string; attachment?: string }>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const attachment = file ? { name: file.name, size: file.size } : undefined
    const found = validateReply(message, attachment)
    setErrors(found)
    if (found.message || found.attachment) return
    onSend({ message: message.trim(), attachment, file: file ?? undefined })
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Add a reply" className="space-y-4 border bg-white p-4">
      <div>
        <label htmlFor="ticket-reply" className="mb-1.5 block text-sm font-medium">
          Add a reply
        </label>
        <Textarea
          id="ticket-reply"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (errors.message) setErrors((p) => ({ ...p, message: undefined }))
          }}
          rows={4}
          placeholder="Add a reply..."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'ticket-reply-error' : 'ticket-reply-help'}
          className={cn('bg-white', errors.message && 'border-destructive')}
        />
        <p id="ticket-reply-help" className="mt-1 text-xs text-muted-foreground">
          Never include passwords or verification codes. Up to {REPLY_MAX} characters.
        </p>
        {errors.message && (
          <p id="ticket-reply-error" className="mt-1 text-sm font-medium text-destructive">
            <span aria-hidden="true">⚠ </span>
            {errors.message}
          </p>
        )}
      </div>
      <AttachmentUpload
        file={file}
        onChange={(f) => {
          setFile(f)
          setErrors((p) => ({ ...p, attachment: undefined }))
        }}
        error={errors.attachment}
        help={`Optional. PDF, Word, Excel, JPG, PNG or text, up to 5 MB. ${UPLOAD_NOTE}`}
      />
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send Reply'}
      </Button>
    </form>
  )
}
