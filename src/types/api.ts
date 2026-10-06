/**
 * API contract types shared by the API client and every feature service.
 * They follow Laravel's conventions (API Resources, the paginator, 422 validation bodies), so the backend does not
 * need to bend to the frontend. If the real Laravel contract differs, adapt it inside the feature service.
 */

/** Single resource or plain list wrapped by a Laravel API Resource: `{ "data": ..., "message"?: "..." }`. */
export interface ApiResponse<T> {
  data: T
  message?: string
}

/** Laravel paginator shape (also used by the existing mock services, so UI code is unchanged). */
export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/** Laravel validation errors: field name -> messages. */
export type ValidationErrors = Record<string, string[]>

/**
 * A failed API call in a safe, normalised form. `message` is a user-safe sentence chosen by the client
 * (never raw backend text, stack traces or SQL). `errors` is set for 422 responses so forms can show field messages.
 */
export interface ApiError {
  message: string
  /** HTTP status, or 0 when no response was received (network failure or timeout). */
  status: number
  kind: 'network' | 'timeout' | 'http'
  errors?: ValidationErrors
}

/** Common list query parameters (only send the ones an endpoint supports). */
export interface ListParams {
  search?: string
  category?: string
  department?: string
  status?: string
  date_from?: string
  date_to?: string
  /** A whitelisted sort key, e.g. "newest", "oldest", "name", "updated". The backend maps it to a column. */
  sort?: string
  page?: number
  per_page?: number
}
