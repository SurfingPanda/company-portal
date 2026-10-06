import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribeToFreshData, withRevalidation } from '@/services/api'

interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
}

/**
 * Runs an async loader whenever `deps` change. Keeps the previous data while reloading,
 * so lists can dim instead of flashing to a skeleton on every keystroke.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: undefined, loading: true })
  const [attempt, setAttempt] = useState(0)
  const latestLoader = useRef(loader)
  latestLoader.current = loader
  const settled = useRef(false)
  settled.current = !state.loading

  // When a background refresh found newer data on the server, load again from the (now updated) remembered answers and change
  // the screen only if something is actually different. No loading state, and a failure here is ignored: the page keeps what it has.
  useEffect(() => {
    let alive = true
    const unsubscribe = subscribeToFreshData(() => {
      if (!settled.current) return
      withRevalidation(() => latestLoader.current()).then(
        (data) => {
          if (alive) setState((prev) => (JSON.stringify(prev.data) === JSON.stringify(data) ? prev : { data, error: undefined, loading: false }))
        },
        () => undefined,
      )
    })
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, error: undefined, loading: true }))
    withRevalidation(loader).then(
      (data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false })
      },
      (error: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            error: error instanceof Error ? error : new Error('Request failed'),
            loading: false,
          }))
        }
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { ...state, retry }
}
