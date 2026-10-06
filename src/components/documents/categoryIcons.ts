import { BookOpen, Briefcase, Building2, ClipboardList, LayoutTemplate, Monitor, ScrollText, Users, type LucideIcon } from 'lucide-react'
import type { DocumentCategory } from '@/types/document'

export const categoryIcons: Record<DocumentCategory, LucideIcon> = {
  policies: ScrollText,
  forms: ClipboardList,
  templates: LayoutTemplate,
  manuals: BookOpen,
  hr: Users,
  recruitment: Briefcase,
  it: Monitor,
  company: Building2,
}
