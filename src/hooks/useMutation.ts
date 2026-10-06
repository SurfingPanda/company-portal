import { useCallback, useRef, useState } from 'react'
import { getApiErrorMessage, getFieldErrors } from '@/lib/apiErrors'

export type MutationStatus = 'idle' | 'submitting' | 'success' | 'error'

/**
 * State for one write (submit a request, send a reply, save preferences…): idle -> submitting -> success | error.
 * A second call while one is running is ignored, so a double click cannot send a duplicate request.
 * Errors are normalised through the API client: `error` is a safe sentence, `fieldErrors` maps Laravel 422 messages to field ids.
 */
export function useMutation<TInput, TResult>(action: (input: TInput) => Promise<TResult>) {
  const [status, setStatus] = useState<MutationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const running = useRef(false)

  const mutate = useCallback(
    async (input: TInput): Promise<TResult | undefined> => {
      if (running.current) return undefined
      running.current = true
      setStatus('submitting')
      setError(null)
      setFieldErrors({})
      try {
        const result = await action(input)
        setStatus('success')
        return result
      } catch (caught) {
        setFieldErrors(getFieldErrors(caught))
        setError(getApiErrorMessage(caught, 'Something went wrong. Please try again.'))
        setStatus('error')
        return undefined
      } finally {
        running.current = false
      }
    },
    [action],
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setFieldErrors({})
  }, [])

  return { mutate, reset, status, error, fieldErrors, submitting: status === 'submitting' }
}
