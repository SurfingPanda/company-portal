import type { Permission } from '@/auth/permissions'
export type * from './employee'

export interface NewsArticle {
  id: string
  title: string
  category: string
  date: string
  excerpt: string
  imageUrl?: string
  href: string
}

export interface Resource {
  id: string
  title: string
  type: string
  updated?: string
  href: string
}

export interface NavItem {
  label: string
  href: string
  /** Extra path prefixes (besides `href`) that should mark this item as active, e.g. modules reached through Services. */
  alsoActiveFor?: string[]
  /** Item is shown only to people with this permission (UI only; the backend still authorizes). */
  permission?: Permission
  /** Alternative to `permission`: shown when the person holds ANY of these. */
  anyPermission?: readonly Permission[]
}
