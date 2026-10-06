import type { PaginatedResponse } from '@/types/employee'

/** Laravel's resource-collection envelope: `{ data, links, meta: { current_page, last_page, per_page, total } }`. */
export interface ApiPage<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

/** Maps a Laravel page to the flat shape the portal's lists already use, converting each item on the way. */
export function toPaginated<TApi, T>(page: ApiPage<TApi>, map: (item: TApi) => T): PaginatedResponse<T> {
  return {
    data: page.data.map(map),
    current_page: page.meta.current_page,
    last_page: page.meta.last_page,
    per_page: page.meta.per_page,
    total: page.meta.total,
  }
}
