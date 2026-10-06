import { useRef, useState } from 'react'
import { EmployeeAvatar } from '@/components/common/EmployeeAvatar'
import { Button } from '@/components/ui/button'

const MAX_BYTES = 2 * 1024 * 1024

interface ProfileAvatarProps {
  name: string
  /** Current image (a saved photo or a local preview). */
  imageUrl?: string
  onSelect: (file: File) => void
  onRemove: () => void
}

/**
 * Avatar with Change Photo / Remove Photo controls. It only reports the chosen file to its parent,
 * which shows a local preview. Nothing is uploaded: later this connects to
 * POST /api/profile/avatar and DELETE /api/profile/avatar.
 */
export function ProfileAvatar({ name, imageUrl, onSelect, onRemove }: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (JPG, PNG or similar).')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('The image is larger than 2 MB.')
      return
    }
    setError(undefined)
    onSelect(file)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <EmployeeAvatar name={name} imageUrl={imageUrl} className="size-24 text-2xl [&_span]:text-2xl" />
      <div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="bg-white" onClick={() => inputRef.current?.click()}>
            Change Photo
          </Button>
          {imageUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              Remove Photo
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a profile photo"
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">JPG or PNG, up to 2 MB. This is a local preview only; nothing is uploaded yet.</p>
        {error && (
          <p role="alert" className="mt-1 text-sm font-medium text-destructive">
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
