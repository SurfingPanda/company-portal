import type { NavItem } from '@/types'

/** True when the current path is the item's own page or one of its `alsoActiveFor` sections (including sub-paths). */
export const isAlsoActive = (item: NavItem, pathname: string) =>
  Boolean(item.alsoActiveFor?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)))
