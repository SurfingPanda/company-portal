import { UserRound } from 'lucide-react'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { cn } from '@/lib/utils'
import type { LeadershipMember } from '@/types/company'

interface LeadershipPreviewProps {
  members: LeadershipMember[]
  limit?: number
  /** Show each person's biography (full Leadership page). */
  showBiography?: boolean
}

function LeaderPhoto({ member }: { member: LeadershipMember }) {
  // A real photo gets the person's name as alt text; placeholders show a neutral silhouette with no alt.
  if (member.photoUrl) {
    return <img src={member.photoUrl} alt={member.name} className="size-16 shrink-0 border object-cover" />
  }
  return (
    <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center border bg-secondary text-muted-foreground/60">
      <UserRound className="size-7" strokeWidth={1.25} />
    </span>
  )
}

/** Restrained list of leaders: photo, name, position and optional biography. */
export function LeadershipPreview({ members, limit, showBiography = false }: LeadershipPreviewProps) {
  const items = limit ? members.slice(0, limit) : members

  return (
    <ul className="grid border-l border-t bg-white md:grid-cols-2">
      {items.map((member) => {
        const placeholder = member.status === 'placeholder'
        return (
          <li key={member.id} className="flex gap-4 border-b border-r p-4">
            <LeaderPhoto member={member} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn('font-serif text-lg font-semibold leading-tight', placeholder ? 'text-muted-foreground' : 'text-primary')}>
                  {member.name}
                </h3>
                {placeholder && <PlaceholderTag />}
              </div>
              <p className="text-sm text-foreground/80">
                {member.position}
                {member.department && <span className="text-muted-foreground"> · {member.department}</span>}
              </p>
              {showBiography && member.biography && (
                <p className={cn('mt-2 text-sm leading-relaxed', placeholder ? 'italic text-muted-foreground' : 'text-foreground/80')}>
                  {member.biography}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
