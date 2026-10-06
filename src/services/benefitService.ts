import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/benefits.api'
import { benefitFaqs } from '@/data/benefitFaq'
import { benefitCategories, benefitResourceGroups, benefitResourceLinks, benefits } from '@/data/benefits'
import type { BenefitCategory, BenefitFAQ, BenefitFaqQuery, BenefitQuery, BenefitResourceLink, EmployeeBenefit } from '@/types/benefit'

/**
 * Service layer for Benefits & Employee Resources (information only).
 *
 *   getBenefits / getFeaturedBenefits   GET /api/benefits, /api/benefits/featured
 *   getBenefit                          GET /api/benefits/{id}
 *   getBenefitCategories                GET /api/benefits/categories
 *   getBenefitFaqs                      GET /api/benefits/faq
 *   getBenefitResources                 GET /api/benefits/resources
 * Benefit requests are ordinary Phase 8 requests (POST /api/requests today; /api/benefits/requests later).
 *
 * The portal is not the source of truth for benefits: nothing here calculates eligibility, balances or contributions.
 * Official employee-specific data comes from HR through the Laravel API, never straight from the browser.
 */

const MOCK_LATENCY_MS = 200
const wait = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const matches = (haystack: string, search: string) =>
  search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.toLowerCase().includes(term))

export const getBenefitCategoryLabel = (id: string) => benefitCategories.find((c) => c.id === id)?.label ?? id

/** GET /api/benefits. Search covers name, description and category only. */
async function mockGetBenefits(query: BenefitQuery = {}): Promise<EmployeeBenefit[]> {
  await wait()
  return benefits
    .filter((b) => (query.category ? b.category === query.category : true))
    .filter((b) => (query.search?.trim() ? matches([b.name, b.shortDescription, b.description, getBenefitCategoryLabel(b.category)].join(' '), query.search) : true))
}

/** GET /api/benefits/featured */
async function mockGetFeaturedBenefits(): Promise<EmployeeBenefit[]> {
  await wait()
  return benefits.filter((b) => b.isFeatured)
}

/** GET /api/benefits/{id} */
async function mockGetBenefit(id: string): Promise<EmployeeBenefit | null> {
  await wait()
  return benefits.find((b) => b.id === id) ?? null
}

/** GET /api/benefits/categories. Only categories that have at least one benefit are returned, with counts. */
async function mockGetBenefitCategories(): Promise<(BenefitCategory & { count: number })[]> {
  await wait()
  return benefitCategories.map((c) => ({ ...c, count: benefits.filter((b) => b.category === c.id).length })).filter((c) => c.count > 0)
}

/** GET /api/benefits/faq */
async function mockGetBenefitFaqs(query: BenefitFaqQuery = {}): Promise<BenefitFAQ[]> {
  await wait()
  return benefitFaqs
    .filter((f) => (query.category ? f.category === query.category : true))
    .filter((f) => (query.search?.trim() ? matches([f.question, f.answer, f.category ?? ''].join(' '), query.search) : true))
}

async function mockGetBenefitFaqCategories(): Promise<string[]> {
  return [...new Set(benefitFaqs.map((f) => f.category).filter((c): c is string => Boolean(c)))]
}

/** GET /api/benefits/resources */
export async function getBenefitResources(): Promise<BenefitResourceLink[]> {
  await wait()
  return benefitResourceLinks
}

/** GET /api/benefits/resources (grouped for the Resources page). */
export async function getBenefitResourceGroups() {
  await wait()
  return benefitResourceGroups
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getBenefits: typeof mockGetBenefits = isApiMode ? apiAdapter.getBenefits : mockGetBenefits
export const getFeaturedBenefits: typeof mockGetFeaturedBenefits = isApiMode ? apiAdapter.getFeaturedBenefits : mockGetFeaturedBenefits
export const getBenefit: typeof mockGetBenefit = isApiMode ? apiAdapter.getBenefit : mockGetBenefit
export const getBenefitCategories: typeof mockGetBenefitCategories = isApiMode ? apiAdapter.getBenefitCategories : mockGetBenefitCategories
export const getBenefitFaqs: typeof mockGetBenefitFaqs = isApiMode ? apiAdapter.getBenefitFaqs : mockGetBenefitFaqs
export const getBenefitFaqCategories: typeof mockGetBenefitFaqCategories = isApiMode ? apiAdapter.getBenefitFaqCategories : mockGetBenefitFaqCategories
