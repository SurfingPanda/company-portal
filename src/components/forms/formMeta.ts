import {
  Ban,
  Briefcase,
  Building2,
  CheckCheck,
  CircleCheck,
  CircleEllipsis,
  CircleX,
  Clock,
  FileDown,
  FilePen,
  Monitor,
  Send,
  SquarePen,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { RequestCategory, RequestStatus } from '@/types/request'

export const categoryIcons: Record<RequestCategory, LucideIcon> = {
  hr: Users,
  recruitment: Briefcase,
  it: Monitor,
  administration: Building2,
  other: CircleEllipsis,
}

export const statusIcons: Record<RequestStatus, LucideIcon> = {
  draft: FilePen,
  submitted: Send,
  'under-review': Clock,
  approved: CircleCheck,
  rejected: CircleX,
  completed: CheckCheck,
  cancelled: Ban,
}

/** Forms (documents to download) and requests (submitted online) get different icons and labels. */
export const kindMeta = {
  download: { icon: FileDown, label: 'Downloadable Form' },
  online: { icon: SquarePen, label: 'Online Form' },
  request: { icon: SquarePen, label: 'Online Request' },
} as const
