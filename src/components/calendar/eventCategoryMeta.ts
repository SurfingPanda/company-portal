import {
  Briefcase,
  CalendarClock,
  CalendarHeart,
  CircleEllipsis,
  GraduationCap,
  Landmark,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { EventCategory } from '@/types/event'

interface CategoryMeta {
  icon: LucideIcon
  /** Left border colour (subtle marker). */
  border: string
  /** Small dot colour. */
  dot: string
}

/**
 * Restrained category markers. Colour is never the only cue: every category also has its own icon and label.
 */
export const eventCategoryMeta: Record<EventCategory, CategoryMeta> = {
  'company-event': { icon: Landmark, border: 'border-l-primary', dot: 'bg-primary' },
  training: { icon: GraduationCap, border: 'border-l-gold', dot: 'bg-gold' },
  meeting: { icon: Users, border: 'border-l-slate-500', dot: 'bg-slate-500' },
  holiday: { icon: Sun, border: 'border-l-amber-600', dot: 'bg-amber-600' },
  deadline: { icon: CalendarClock, border: 'border-l-red-700', dot: 'bg-red-700' },
  'employee-activity': { icon: CalendarHeart, border: 'border-l-teal-600', dot: 'bg-teal-600' },
  'department-event': { icon: Briefcase, border: 'border-l-sky-700', dot: 'bg-sky-700' },
  other: { icon: CircleEllipsis, border: 'border-l-gray-400', dot: 'bg-gray-400' },
}
