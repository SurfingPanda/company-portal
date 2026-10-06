import * as apiAdapter from '@/services/adapters/company.api'
import { isApiMode } from '@/services/dataMode'
import {
  companyMilestones,
  companyProfile,
  departments,
  leadershipMembers,
  locations,
  organizationStructure,
} from '@/data/companyData'
import type {
  CompanyMilestone,
  CompanyOverviewData,
  CompanyProfile,
  Department,
  LeadershipMember,
  Location,
  OrganizationStructure,
} from '@/types/company'

/**
 * Service layer for company information.
 * Each function maps to a future Laravel endpoint; swap the body for a `fetch` call that returns
 * the same shape and the pages/components stay unchanged.
 */

const MOCK_LATENCY_MS = 200
const respond = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
  return value
}

/** GET /api/company */
const mockGetCompanyProfile = (): Promise<CompanyProfile> => respond(companyProfile)

/** GET /api/company/history */
const mockGetCompanyHistory = (): Promise<CompanyMilestone[]> => respond(companyMilestones)

/** GET /api/company/leadership */
const mockGetLeadership = (): Promise<LeadershipMember[]> => respond(leadershipMembers)

/** GET /api/company/departments */
const mockGetDepartments = (): Promise<Department[]> => respond(departments)

/** GET /api/company/departments (organizational structure) */
const mockGetOrganizationStructure = (): Promise<OrganizationStructure> => respond(organizationStructure)

/** GET /api/company/locations */
const mockGetLocations = (): Promise<Location[]> => respond(locations)

/** Everything the overview page needs, loaded together. */
export async function getCompanyOverview(): Promise<CompanyOverviewData> {
  const [profile, milestones, leadership, departmentList, locationList] = await Promise.all([
    getCompanyProfile(),
    getCompanyHistory(),
    getLeadership(),
    getDepartments(),
    getLocations(),
  ])
  return { profile, milestones, leadership, departments: departmentList, locations: locationList }
}

// --- Data source: Laravel (published content only) in API mode, the sample content above in mock mode. ---
export const getCompanyProfile: typeof mockGetCompanyProfile = isApiMode ? apiAdapter.getCompanyProfile : mockGetCompanyProfile
export const getCompanyHistory: typeof mockGetCompanyHistory = isApiMode ? apiAdapter.getCompanyHistory : mockGetCompanyHistory
export const getLeadership: typeof mockGetLeadership = isApiMode ? apiAdapter.getLeadership : mockGetLeadership
export const getDepartments: typeof mockGetDepartments = isApiMode ? apiAdapter.getDepartments : mockGetDepartments
export const getOrganizationStructure: typeof mockGetOrganizationStructure = isApiMode ? apiAdapter.getOrganizationStructure : mockGetOrganizationStructure
export const getLocations: typeof mockGetLocations = isApiMode ? apiAdapter.getLocations : mockGetLocations
