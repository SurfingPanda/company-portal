import type { RecruitmentConfig } from '@/types/recruitment'

/**
 * EXTERNAL RECRUITMENT SYSTEM (configuration, not code).
 *
 * If recruitment is later handled by another system, set `VITE_RECRUITMENT_URL` (and optionally
 * `VITE_RECRUITMENT_SYSTEM_NAME`) in `.env`. "Apply Now" then opens that system in a new tab.
 * While the address is empty, the portal's demo application flow is used. No URL is hard-coded.
 * A Laravel backend can later serve the same shape from `GET /api/recruitment/config`.
 */
const url = (import.meta.env.VITE_RECRUITMENT_URL as string | undefined)?.trim() ?? ''

export const RECRUITMENT_CONFIG: RecruitmentConfig = {
  externalApplicationUrl: url,
  externalRecruitmentSystemName: (import.meta.env.VITE_RECRUITMENT_SYSTEM_NAME as string | undefined)?.trim() ?? '',
  externalApplicationEnabled: url.length > 0,
}
