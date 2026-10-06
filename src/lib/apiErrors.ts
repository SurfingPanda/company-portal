import { ApiRequestError } from '@/services/api'

/**
 * Reusable helpers for turning API failures into UI messages, so no form needs its own validation-error handling.
 * Nothing here reads raw backend text: messages come from the API client's safe per-status wording.
 */

/** Safe message for any thrown value. Use as the generic error line of a form or section. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again later.'): string {
  return error instanceof ApiRequestError ? error.message : fallback
}

/** True when the failure was a Laravel 422 validation response. */
export const isValidationError = (error: unknown): error is ApiRequestError => error instanceof ApiRequestError && error.status === 422

/**
 * Maps a 422 response to `{ fieldId: "first message" }`, the shape existing forms already use (`FieldErrors`).
 * Laravel dotted keys ("answers.0.value") and snake_case names are mapped through `keyMap` when the form's field ids differ;
 * unmapped fields keep the server's key. Returns an empty object for anything that is not a validation error.
 *
 * Example: `{ reason: ["The reason field is required."] }` -> `{ reason: "The reason field is required." }`
 */
export function getFieldErrors(error: unknown, keyMap: Record<string, string> = {}): Record<string, string> {
  if (!isValidationError(error) || !error.errors) return {}
  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(error.errors)) {
    if (messages.length > 0) result[keyMap[field] ?? field] = messages[0]
  }
  return result
}
