import { benefitCategories } from '@/data/benefits'
import { api } from '@/services/api'
import type { ApiPage } from '@/services/adapters/paginate'
import type { ApiResponse } from '@/types/api'
import type { BenefitCategory, BenefitCategoryId, BenefitFAQ, BenefitFaqQuery, BenefitQuery, BenefitStatus, EmployeeBenefit } from '@/types/benefit'

/**
 * Benefits, Laravel adapter: GET /api/benefits[/{id}|/featured|/faq]. Benefits are INFORMATION ONLY: nothing here (or in
 * Laravel) calculates eligibility, amounts, claims, reimbursements, deductions or contributions.
 */
interface ApiBenefit {
  id: number
  name: string
  short_description: string
  description: string
  eligibility: string | null
  category: BenefitCategoryId
  status: BenefitStatus
  is_featured: boolean
  is_sample?: boolean
}

interface ApiBenefitFaq {
  id: number
  benefit_id: number | null
  question: string
  answer: string
  category: string | null
}

const toBenefit = (b: ApiBenefit): EmployeeBenefit => ({
  id: String(b.id),
  name: b.name,
  shortDescription: b.short_description,
  description: b.description,
  category: b.category,
  status: b.status,
  isFeatured: b.is_featured,
  eligibility: b.eligibility ?? undefined,
  isSample: b.is_sample,
})

const toFaq = (f: ApiBenefitFaq): BenefitFAQ => ({
  id: String(f.id),
  question: f.question,
  answer: f.answer,
  category: f.category ?? undefined,
  relatedBenefitId: f.benefit_id === null ? undefined : String(f.benefit_id),
})

export async function getBenefits(query: BenefitQuery = {}): Promise<EmployeeBenefit[]> {
  const page = await api.get<ApiPage<ApiBenefit>>('/api/benefits', { search: query.search?.trim(), category: query.category, per_page: 100 })
  return page.data.map(toBenefit)
}

export async function getFeaturedBenefits(): Promise<EmployeeBenefit[]> {
  return (await api.get<ApiResponse<ApiBenefit[]>>('/api/benefits/featured')).data.map(toBenefit)
}

export async function getBenefit(id: string): Promise<EmployeeBenefit | null> {
  try {
    return toBenefit((await api.get<ApiResponse<ApiBenefit>>(`/api/benefits/${encodeURIComponent(id)}`)).data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

export async function getBenefitCategories(): Promise<(BenefitCategory & { count: number })[]> {
  const all = await getBenefits()
  return benefitCategories.map((c) => ({ ...c, count: all.filter((b) => b.category === c.id).length })).filter((c) => c.count > 0)
}

export async function getBenefitFaqs(query: BenefitFaqQuery = {}): Promise<BenefitFAQ[]> {
  const page = await api.get<ApiPage<ApiBenefitFaq>>('/api/benefits/faq', { search: query.search?.trim(), per_page: 100 })
  return page.data.map(toFaq).filter((f) => (query.category ? f.category === query.category : true))
}

export async function getBenefitFaqCategories(): Promise<string[]> {
  const page = await api.get<ApiPage<ApiBenefitFaq>>('/api/benefits/faq', { per_page: 100 })
  return [...new Set(page.data.map((f) => f.category).filter((c): c is string => Boolean(c)))]
}
