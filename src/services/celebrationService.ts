import { api } from '@/services/api'
import type { ApiResponse } from '@/types/api'
import type { Celebrations } from '@/types/celebration'

/** Birthdays (only for people who agreed, day and month only) and work anniversaries in the next `days` days. */
export const getCelebrations = async (days = 30): Promise<Celebrations> => (await api.get<ApiResponse<Celebrations>>('/api/celebrations', { days })).data
