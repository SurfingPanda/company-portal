import { Lock } from 'lucide-react'
import { accessLevelLabels } from '@/data/documentCategories'
import type { DocumentAccessLevel } from '@/types/document'

/** Shows who can open a document. Hidden for "All Employees" in lists to keep them quiet. */
export function AccessLabel({ level, showAll = false }: { level: DocumentAccessLevel; showAll?: boolean }) {
  if (level === 'all' && !showAll) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {level !== 'all' && <Lock className="size-3" aria-hidden="true" />}
      {accessLevelLabels[level]}
    </span>
  )
}
