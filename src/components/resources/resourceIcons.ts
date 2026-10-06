import { Building2, CircleHelp, ClipboardList, HeartPulse, LifeBuoy, Monitor, ScrollText, Users, type LucideIcon } from 'lucide-react'
import type { ResourceCategoryId } from '@/types/resource'

/** One icon per category (Lucide). The category name is always shown as text beside it. */
export const resourceCategoryIcons: Record<ResourceCategoryId, LucideIcon> = {
  hr: Users,
  it: Monitor,
  company: Building2,
  policies: ScrollText,
  forms: ClipboardList,
  benefits: HeartPulse,
  support: LifeBuoy,
  faq: CircleHelp,
}
