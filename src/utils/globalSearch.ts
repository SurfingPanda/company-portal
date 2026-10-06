import type { GlobalSearchResult, SearchQuery, SearchResponse, SearchResultType } from '@/types/search'

/**
 * Deterministic frontend search. Pure functions only (no React, no network), so the same call shape can later be
 * answered by `GET /api/search` instead. The index is prepared once; a query only scans it.
 */

/** Lowercase, remove accents and punctuation, collapse whitespace. "IT  Support!" and "it support" normalise the same. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** A result with its searchable fields normalised once, at index time. */
export interface IndexedResult {
  result: GlobalSearchResult
  title: string
  description: string
  category: string
  tags: string[]
  keywords: string
}

export function buildSearchIndex(results: GlobalSearchResult[]): IndexedResult[] {
  return results.map((result) => ({
    result,
    title: normalize(result.title),
    description: normalize(result.description),
    category: normalize(result.category ?? ''),
    tags: (result.tags ?? []).map(normalize),
    keywords: normalize((result.keywords ?? []).join(' ')),
  }))
}

/**
 * Relevance score for a normalised query. Phrase weights: exact title +100, title contains +60, tag contains +40,
 * category contains +30, keyword contains +25, description contains +20. Each query word that appears in the title adds
 * a little extra. Returns 0 when the result does not match (every word must appear somewhere).
 */
export function scoreResult(entry: IndexedResult, query: string): number {
  if (!query) return 0
  const words = query.split(' ')
  const haystack = `${entry.title} ${entry.description} ${entry.category} ${entry.tags.join(' ')} ${entry.keywords}`
  if (!words.every((w) => haystack.includes(w))) return 0

  let score = 0
  if (entry.title === query) score += 100
  if (entry.title.includes(query)) score += 60
  if (entry.tags.some((t) => t.includes(query))) score += 40
  if (entry.category.includes(query)) score += 30
  if (entry.keywords.includes(query)) score += 25
  if (entry.description.includes(query)) score += 20

  for (const w of words) {
    if (entry.title.includes(w)) score += 10
    if (entry.tags.some((t) => t.includes(w))) score += 4
    if (entry.category.includes(w)) score += 3
  }
  if (entry.result.isFeatured) score += 2
  return Math.max(score, 1)
}

const dateValue = (r: GlobalSearchResult) => (r.date ? new Date(r.date).getTime() || 0 : 0)

/** Runs a query against a prepared index and returns one page of results. */
export function searchIndex(index: IndexedResult[], query: SearchQuery): SearchResponse {
  const { q, type, sort = 'relevance', page = 1, perPage = 20 } = query
  const normalized = normalize(q)

  const scored = normalized ? index.map((entry) => ({ entry, score: scoreResult(entry, normalized) })).filter((s) => s.score > 0) : []

  const counts: Partial<Record<SearchResultType, number>> = {}
  for (const { entry } of scored) counts[entry.result.type] = (counts[entry.result.type] ?? 0) + 1

  const filtered = type ? scored.filter((s) => s.entry.result.type === type) : scored
  filtered.sort((a, b) => {
    if (sort === 'newest') return dateValue(b.entry.result) - dateValue(a.entry.result) || b.score - a.score
    if (sort === 'az') return a.entry.result.title.localeCompare(b.entry.result.title)
    return b.score - a.score || a.entry.result.title.localeCompare(b.entry.result.title)
  })

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(1, page), lastPage)
  const start = (current - 1) * perPage
  return { data: filtered.slice(start, start + perPage).map((s) => s.entry.result), total, page: current, perPage, counts }
}
