import type { ApiError, ListParams, ValidationErrors } from '@/types/api'

/**
 * Central API client for the Laravel backend. Feature services call this; pages and components never call `fetch`.
 *
 *   Page -> feature service (e.g. notificationService) -> api.get("/api/notifications") -> Laravel
 *
 *  - Base URL from `VITE_API_BASE_URL` (empty = same origin).
 *  - Cookie/session auth: every request sends credentials. Sanctum CSRF: `GET /sanctum/csrf-cookie` is called before the
 *    first state-changing request and the `XSRF-TOKEN` cookie is echoed in `X-XSRF-TOKEN`. CSRF is never bypassed.
 *  - JSON in/out; `FormData` bodies are sent as multipart (file uploads) without forcing a content type.
 *  - Timeout (15 s) so a stuck request cannot hang the UI.
 *  - Errors become `ApiRequestError` with a SAFE message per status. Laravel exception text is never surfaced.
 *  - 401 on an ordinary request -> the registered unauthorized handler clears the session (the router then returns the
 *    employee to /login). Requests under /api/auth/ never trigger it, so the login flow cannot loop.
 *  - 403 -> the registered forbidden handler opens the Access Restricted page. The user stays signed in.
 *  - No tokens, passwords or secrets are stored here.
 */

export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').trim().replace(/\/+$/, '')

const REQUEST_TIMEOUT_MS = 15_000

/** Messages shown for failures. Chosen here, never taken from the server response. */
const statusMessages: Record<number, string> = {
  401: 'Your session has ended. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  419: 'Your session expired. Please try again.',
  422: 'Some of the information provided is not valid.',
  429: 'Too many requests. Please wait a moment and try again.',
  503: 'The employee portal is temporarily unavailable. Please try again later.',
}
const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later.'

export class ApiRequestError extends Error implements ApiError {
  kind: ApiError['kind']
  status: number
  errors?: ValidationErrors

  constructor(kind: ApiError['kind'], status: number, message: string, errors?: ValidationErrors) {
    super(message)
    this.name = 'ApiRequestError'
    this.kind = kind
    this.status = status
    this.errors = errors
  }
}

let csrfReady: Promise<void> | undefined

let forbiddenHandler: (() => void) | undefined
let unauthorizedHandler: (() => void) | undefined

/** Called when a non-authentication request gets 403. The app registers one handler (opens /unauthorized). */
export function setForbiddenHandler(handler: (() => void) | undefined) {
  forbiddenHandler = handler
}

/** Called when a non-authentication request gets 401 (session gone). The app registers one handler (clears auth state). */
export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  unauthorizedHandler = handler
}

/** Primes the Sanctum CSRF cookie once. A failure is reported as a network error and retried on the next request. */
async function ensureCsrfCookie(): Promise<void> {
  csrfReady ??= fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, { credentials: 'include', headers: { Accept: 'application/json' } }).then(
    () => undefined,
    () => {
      csrfReady = undefined
      throw new ApiRequestError('network', 0, 'Unable to reach the server.')
    },
  )
  return csrfReady
}

function readXsrfToken(): string | undefined {
  const match = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))
  return match ? decodeURIComponent(match.slice('XSRF-TOKEN='.length)) : undefined
}

/** Reads Laravel's `errors` object from a 422 body, keeping only string messages. Everything else in the body is ignored. */
async function readValidationErrors(response: Response): Promise<ValidationErrors | undefined> {
  try {
    const body: unknown = await response.json()
    if (typeof body !== 'object' || body === null || !('errors' in body)) return undefined
    const raw = (body as { errors: unknown }).errors
    if (typeof raw !== 'object' || raw === null) return undefined
    const result: ValidationErrors = {}
    for (const [field, messages] of Object.entries(raw)) {
      if (Array.isArray(messages)) result[field] = messages.filter((m): m is string => typeof m === 'string')
    }
    return result
  } catch {
    return undefined
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Query-string parameters. Undefined and empty values are skipped. */
  params?: ListParams | Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

function buildUrl(path: string, params: RequestOptions['params']): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  const qs = query.toString()
  return `${API_BASE_URL}${path}${qs ? `${path.includes('?') ? '&' : '?'}${qs}` : ''}`
}

/** One real network call. Returns the parsed JSON body (undefined for 204). Rejects with `ApiRequestError`. */
async function networkRequest<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = 'GET', body, params, signal } = options
  const stateChanging = method !== 'GET'

  if (stateChanging) await ensureCsrfCookie()

  const headers: Record<string, string> = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (stateChanging) {
    const token = readXsrfToken()
    if (token) headers['X-XSRF-TOKEN'] = token
  }

  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS)
  signal?.addEventListener('abort', () => timeout.abort())

  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: timeout.signal,
    })
  } catch {
    if (timeout.signal.aborted && !signal?.aborted) throw new ApiRequestError('timeout', 0, 'The employee portal took too long to respond. Please try again.')
    throw new ApiRequestError('network', 0, 'Unable to reach the server.')
  } finally {
    clearTimeout(timer)
  }

  // Expired/missing CSRF token: fetch a fresh cookie and retry once.
  if (response.status === 419 && !isRetry) {
    csrfReady = undefined
    return networkRequest<T>(path, options, true)
  }

  if (!response.ok) {
    const isAuthFlow = path.startsWith('/api/auth/')
    if (response.status === 401 && !isAuthFlow) {
      clearApiCache()
      unauthorizedHandler?.()
    }
    if (response.status === 403 && !isAuthFlow) forbiddenHandler?.()
    const errors = response.status === 422 ? await readValidationErrors(response) : undefined
    const message = statusMessages[response.status] ?? GENERIC_SERVER_MESSAGE
    throw new ApiRequestError('http', response.status, message, errors)
  }

  if (response.status === 204) return undefined as T
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiRequestError('http', response.status, GENERIC_SERVER_MESSAGE)
  }
}

// --- Response cache -------------------------------------------------------------------------------------------------------
// Moving between pages used to repeat every request, and each one costs the server a fixed amount of time. GET answers are
// therefore remembered and shared while in flight: going back to the dashboard shows what was just loaded at once.
//
// "Show now, refresh behind the scenes" (stale-while-revalidate): a page loaded through `useAsync` is shown the remembered
// answer immediately, even an old one (up to `staleMs`), while a fresh copy is fetched in the background. If the fresh copy
// differs, the cache is updated and `subscribeToFreshData` listeners (the pages) quietly reload from it, so the screen corrects
// itself a fraction of a second later instead of staying out of date for a minute. Callers that cannot update themselves
// (anything outside `useAsync`) only get answers younger than `freshMs`; older ones are fetched normally.
//
// Safety rules: anything that changes data (POST, PUT, PATCH, DELETE) empties the whole cache; sign-in and session calls are
// never cached; a failed answer is never cached (a failed background refresh keeps the old one); and the cache is emptied when
// the session ends or someone signs in.

interface CacheEntry {
  at: number
  value: unknown
}

const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<unknown>>()
/** Bumped whenever the cache is emptied, so an answer that was already on its way is not stored afterwards. */
let epoch = 0

/** Never refetch an answer younger than this, even when stale answers are allowed (rapid navigation, duplicate components). */
const REFRESH_AFTER_MS = 3_000

interface CachePolicy {
  /** Largest age a caller that cannot update itself will be given. */
  freshMs: number
  /** Largest age a `useAsync` page is shown while it is refreshed in the background. 0 = never cached. */
  staleMs: number
}

function cachePolicy(path: string): CachePolicy {
  if (path.startsWith('/api/auth/')) return { freshMs: 0, staleMs: 0 }
  if (path.startsWith('/api/notifications')) return { freshMs: 5_000, staleMs: 60_000 }
  if (path.startsWith('/api/admin') || path.includes('/acknowledgements')) return { freshMs: 5_000, staleMs: 120_000 }
  return { freshMs: 10_000, staleMs: 300_000 }
}

/** While greater than zero, GETs may be answered with a stale copy and refreshed in the background (see `withRevalidation`). */
let revalidationDepth = 0
const revalidating = new Set<string>()
const freshDataListeners = new Set<() => void>()
let freshDataTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Starts a loader whose page can update itself (`useAsync`): requests it makes straight away may be answered from older
 * remembered data while a fresh copy is fetched in the background. The mark covers only the moment the loader starts (the
 * browser runs one thing at a time), so an unrelated request made by something that cannot update itself is never affected.
 */
export function withRevalidation<T>(work: () => Promise<T>): Promise<T> {
  revalidationDepth++
  try {
    return work()
  } finally {
    revalidationDepth--
  }
}

/** Called after a background refresh found that something on the server changed. Returns the way to stop listening. */
export function subscribeToFreshData(listener: () => void): () => void {
  freshDataListeners.add(listener)
  return () => {
    freshDataListeners.delete(listener)
  }
}

function announceFreshData(): void {
  freshDataTimer ??= setTimeout(() => {
    freshDataTimer = undefined
    freshDataListeners.forEach((listener) => listener())
  }, 30)
}

/** Fetches a fresh copy of an answer that is already remembered; if it differs, remembers it and tells the pages. */
function revalidate(key: string, path: string, options: RequestOptions, remembered: unknown): void {
  if (revalidating.has(key)) return
  revalidating.add(key)
  const startedAt = epoch
  enqueueGet<unknown>(path, options).then(
    (value) => {
      revalidating.delete(key)
      if (epoch !== startedAt) return
      cache.set(key, { at: Date.now(), value })
      if (JSON.stringify(value) !== JSON.stringify(remembered)) announceFreshData()
    },
    () => revalidating.delete(key),
  )
}

// --- Batching -------------------------------------------------------------------------------------------------------------
// A page usually asks for several lists at the same moment (the dashboard asks for about a dozen). Each separate HTTP request
// costs the server a fixed start-up time, so GET requests issued within a few milliseconds of each other are sent together as
// ONE call to `/api/batch`, which answers each path exactly as if it had been asked alone (same sign-in, permissions and
// validation). The callers never notice: each still gets its own answer, or its own error.

const BATCH_WINDOW_MS = 20
const BATCH_MAX_PATHS = 25

interface Queued {
  path: string
  options: RequestOptions
  /** The path and query as the server sees it: also the key of the answer in the batch result. */
  relative: string
  resolve: (value: never) => void
  reject: (reason: unknown) => void
}

let queue: Queued[] = []
let queueTimer: ReturnType<typeof setTimeout> | undefined

/** Turns a failed sub-answer into the same `ApiRequestError` a single request would have thrown (and fires the same handlers). */
function errorFromBatch(path: string, status: number, body: unknown): ApiRequestError {
  const isAuthFlow = path.startsWith('/api/auth/')
  if (status === 401 && !isAuthFlow) {
    clearApiCache()
    unauthorizedHandler?.()
  }
  if (status === 403 && !isAuthFlow) forbiddenHandler?.()
  let errors: ValidationErrors | undefined
  if (status === 422 && typeof body === 'object' && body !== null && 'errors' in body && typeof (body as { errors: unknown }).errors === 'object' && (body as { errors: unknown }).errors !== null) {
    errors = {}
    for (const [field, messages] of Object.entries((body as { errors: Record<string, unknown> }).errors)) {
      if (Array.isArray(messages)) errors[field] = messages.filter((m): m is string => typeof m === 'string')
    }
  }
  return new ApiRequestError('http', status, statusMessages[status] ?? GENERIC_SERVER_MESSAGE, errors)
}

async function sendBatch(items: Queued[]): Promise<void> {
  const alone = (item: Queued) => networkRequest<never>(item.path, item.options).then(item.resolve, item.reject)
  try {
    const query = items.map((i) => `paths[]=${encodeURIComponent(i.relative)}`).join('&')
    const response = await networkRequest<{ results: Record<string, { status: number; body: unknown } | undefined> }>(`/api/batch?${query}`)
    for (const item of items) {
      const result = response.results[item.relative]
      if (!result) void alone(item)
      else if (result.status >= 200 && result.status < 300) item.resolve(result.body as never)
      else item.reject(errorFromBatch(item.path, result.status, result.body))
    }
  } catch (error) {
    // The session is gone, or access is refused, or too many requests: every item would get the same answer, so say it once.
    if (error instanceof ApiRequestError && error.kind === 'http' && [401, 403, 429].includes(error.status)) items.forEach((i) => i.reject(error))
    // Anything else (network trouble, an old server without /api/batch): ask for each one on its own.
    else items.forEach((i) => void alone(i))
  }
}

function flushQueue(): void {
  queueTimer = undefined
  const items = queue
  queue = []
  if (items.length === 1) {
    const only = items[0]
    void networkRequest<never>(only.path, only.options).then(only.resolve, only.reject)
    return
  }
  for (let start = 0; start < items.length; start += BATCH_MAX_PATHS) void sendBatch(items.slice(start, start + BATCH_MAX_PATHS))
}

/** Queues a GET to be sent together with the ones asked for in the same instant. */
function enqueueGet<T>(path: string, options: RequestOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ path, options, relative: buildUrl(path, options.params).slice(API_BASE_URL.length), resolve: resolve as (v: never) => void, reject })
    queueTimer ??= setTimeout(flushQueue, BATCH_WINDOW_MS)
  })
}

/** Forgets every remembered answer (after a change, or when the signed-in person changes). */
export function clearApiCache(): void {
  epoch++
  cache.clear()
  inFlight.clear()
}

/**
 * Sends a request and returns the parsed JSON body (undefined for 204). Rejects with `ApiRequestError`.
 * GET requests are answered from the short-lived cache when they can be; every other request goes to the server and then
 * empties the cache.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  if (method !== 'GET') {
    try {
      return await networkRequest<T>(path, options)
    } finally {
      // Even a failed write may have changed something on the server: do not keep showing older answers.
      clearApiCache()
    }
  }

  const policy = cachePolicy(path)
  if (options.signal || policy.staleMs === 0) return networkRequest<T>(path, options)

  const key = buildUrl(path, options.params)
  const hit = cache.get(key)
  if (hit) {
    const age = Date.now() - hit.at
    if (age < REFRESH_AFTER_MS) return structuredClone(hit.value) as T
    if (revalidationDepth > 0 && age < policy.staleMs) {
      revalidate(key, path, options, hit.value)
      return structuredClone(hit.value) as T
    }
    if (revalidationDepth === 0 && age < policy.freshMs) return structuredClone(hit.value) as T
  }
  const pending = inFlight.get(key)
  if (pending) return structuredClone(await pending) as T

  const startedAt = epoch
  const request = enqueueGet<T>(path, options)
  inFlight.set(key, request)
  try {
    const value = await request
    if (epoch === startedAt) cache.set(key, { at: Date.now(), value })
    return structuredClone(value) as T
  } finally {
    if (inFlight.get(key) === request) inFlight.delete(key)
  }
}

/** Verb helpers. `path` starts with "/api/…". */
export const api = {
  get: <T>(path: string, params?: RequestOptions['params'], signal?: AbortSignal) => apiRequest<T>(path, { params, signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  /** Multipart upload (e.g. POST /api/requests/{id}/attachments). The server must validate type, size and ownership. */
  upload: <T>(path: string, form: FormData) => apiRequest<T>(path, { method: 'POST', body: form }),
}
