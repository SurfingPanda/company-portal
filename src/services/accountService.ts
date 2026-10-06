import { api } from '@/services/api'
import { isApiMode } from '@/services/dataMode'

/** Changes the signed-in person's own password. The server checks the current one and signs out every other device. */
export async function changePassword(current: string, next: string, confirmation: string): Promise<{ message: string }> {
  if (!isApiMode) throw new Error('Changing a password needs the Employee Portal server. It is not available in this development build.')
  return api.post<{ message: string }>('/api/account/password', { current_password: current, password: next, password_confirmation: confirmation })
}
