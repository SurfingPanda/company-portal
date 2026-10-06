import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface EmployeeAvatarProps {
  name: string
  imageUrl?: string
  className?: string
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Employee photo with an initials fallback. */
export function EmployeeAvatar({ name, imageUrl, className }: EmployeeAvatarProps) {
  return (
    <Avatar className={cn('size-9 rounded-sm', className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt="" />}
      <AvatarFallback className="rounded-sm bg-primary text-xs font-semibold tracking-wide text-primary-foreground">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
