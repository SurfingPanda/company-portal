import type { AuthMode } from '@/types/auth'

/**
 * WHERE FEATURE DATA COMES FROM.
 *   "api"  -> the Laravel backend through services/api.ts
 *   "mock" -> the local sample data in src/data (development only)
 *
 * Production builds ALWAYS use "api", whatever VITE_DATA_MODE says, so production can never show sample employee data
 * by accident. A migrated feature service that fails in API mode surfaces the error; it never falls back to mock data.
 * Features not yet migrated (see API.md "Migration status") still read sample data until their adapter is added.
 */
export type DataMode = AuthMode

export const DATA_MODE: DataMode = import.meta.env.PROD ? 'api' : (import.meta.env.VITE_DATA_MODE as string | undefined) === 'api' ? 'api' : 'mock'

if (import.meta.env.PROD && (import.meta.env.VITE_DATA_MODE as string | undefined) === 'mock') {
  console.warn('VITE_DATA_MODE=mock is ignored in production builds. The real API is used.')
}

export const isApiMode = DATA_MODE === 'api'
