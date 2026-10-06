import { api } from '@/services/api'
import { isApiMode } from '@/services/dataMode'
import type { ApiResponse } from '@/types/api'

/** Sends the signed-in person a sample of their daily summary email (at most five an hour). Needs the Laravel server. */
export async function sendSampleSummary(): Promise<{ sent_to: string }> {
  if (!isApiMode) throw new Error('Emails need the Employee Portal server. They are not sent in this development build.')
  return (await api.post<ApiResponse<{ sent_to: string }>>('/api/account/email-preview', {})).data
}
