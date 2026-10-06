import type { BenefitCategory, BenefitResourceLink, EmployeeBenefit } from '@/types/benefit'

/**
 * SAMPLE DATA — Replace with HR-approved company information.
 *
 * These are demonstration records, NOT confirmed ELJIN benefits. They contain no coverage, amounts, percentages,
 * eligibility rules, providers or deadlines. `eligibility` and `features` are intentionally left empty so the pages
 * show "has not yet been published" until HR supplies real content. Replaced by `GET /api/benefits` and
 * `GET /api/benefits/categories` once the Laravel backend and HR-approved content exist.
 */

export const benefitCategories: BenefitCategory[] = [
  { id: 'health', label: 'Health & Wellness', description: 'Health, medical and wellness information.' },
  { id: 'insurance', label: 'Insurance', description: 'Insurance-related information.' },
  { id: 'government', label: 'Government Benefits', description: 'Statutory and government-mandated benefits information.' },
  { id: 'assistance', label: 'Financial & Employee Assistance', description: 'Employee assistance information.' },
  { id: 'leave', label: 'Leave & Time Off', description: 'Leave and time-off resources.' },
  { id: 'programs', label: 'Employee Programs', description: 'Employee programs and perks.' },
  { id: 'other', label: 'Other', description: 'Other employee benefit information.' },
]

const SAMPLE = 'Sample benefit information. Replace this content with HR-approved company information.'

export const benefits: EmployeeBenefit[] = [
  {
    id: 'health-wellness', name: 'Health & Wellness', category: 'health', status: 'information-only', isFeatured: true,
    shortDescription: 'Access HR-approved information and resources related to employee health benefits.',
    description: `${SAMPLE} This entry is where HR can describe health and wellness benefits, if any are offered.`,
    relatedDocumentIds: ['doc-027'], relatedFormIds: ['form-benefits-request'], relatedServiceIds: ['hr-benefits-inquiry'], requestTypeId: 'rt-benefits',
  },
  {
    id: 'insurance', name: 'Insurance Coverage', category: 'insurance', status: 'information-only', isFeatured: true,
    shortDescription: 'Find HR-approved information about insurance-related benefits.',
    description: `${SAMPLE} This entry is where HR can describe insurance-related benefits, if any are offered.`,
    relatedDocumentIds: ['doc-027'], relatedFormIds: ['form-benefits-info'], relatedServiceIds: ['hr-benefits-inquiry'], requestTypeId: 'rt-benefits-info',
  },
  {
    id: 'government', name: 'Government Benefits', category: 'government', status: 'information-only', isFeatured: true,
    shortDescription: 'Information about statutory benefits. Official records are kept by HR.',
    description: `${SAMPLE} Official statutory benefit records are maintained by HR, not by this portal.`,
    relatedDocumentIds: ['doc-027'], relatedServiceIds: ['hr-benefits-inquiry'], requestTypeId: 'rt-benefits',
  },
  {
    id: 'employee-assistance', name: 'Employee Assistance', category: 'assistance', status: 'information-only',
    shortDescription: 'Where to ask about employee assistance programs.',
    description: `${SAMPLE} Use this entry to point employees to HR-approved assistance information.`,
    relatedDocumentIds: ['doc-026'], relatedFormIds: ['form-benefits-assistance'], relatedServiceIds: ['hr-benefits-request'], requestTypeId: 'rt-benefits-assistance',
  },
  {
    id: 'leave-resources', name: 'Leave & Time-Off Resources', category: 'leave', status: 'available',
    shortDescription: 'Leave documents and the portal leave request. Balances are handled by HR.',
    description: `${SAMPLE} Leave requests can be filed through the portal; official leave records and balances are handled by HR.`,
    relatedDocumentIds: ['doc-003', 'doc-008'], relatedFormIds: ['form-leave-online'], relatedServiceIds: ['hr-leave-request'],
  },
  {
    id: 'wellness-programs', name: 'Wellness Programs', category: 'programs', status: 'coming-soon',
    shortDescription: 'Wellness program information will be published here if HR provides it.',
    description: `${SAMPLE} No wellness program is confirmed.`,
    relatedServiceIds: ['hr-inquiry'], requestTypeId: 'rt-hr-inquiry',
  },
  {
    id: 'employee-discounts', name: 'Employee Discounts', category: 'programs', status: 'coming-soon',
    shortDescription: 'Employee discount information will be published here if HR provides it.',
    description: `${SAMPLE} No discount arrangement is confirmed.`,
    relatedServiceIds: ['hr-inquiry'], requestTypeId: 'rt-hr-inquiry',
  },
  {
    id: 'other-programs', name: 'Other Employee Programs', category: 'other', status: 'information-only',
    shortDescription: 'Information about other employee programs HR chooses to publish.',
    description: `${SAMPLE} Use this entry for any other program that does not fit another category.`,
    relatedDocumentIds: ['doc-025'], relatedFormIds: ['form-other-benefits'], relatedServiceIds: ['hr-benefits-request'], requestTypeId: 'rt-other-benefits',
  },
].map((b) => ({ ...b, isSample: true }) as EmployeeBenefit)

/** Employee Resources shown on the Benefits pages. Targets are existing modules. */
export const benefitResourceLinks: BenefitResourceLink[] = [
  { id: 'guide', label: 'Benefits Guide', description: 'Sample benefits overview document.', href: '/documents/doc-027' },
  { id: 'faq', label: 'Benefits FAQ', description: 'Common questions about finding benefits information.', href: '/benefits/faq' },
  { id: 'forms', label: 'HR Forms', description: 'HR forms and requests.', href: '/forms?category=hr' },
  { id: 'documents', label: 'HR Documents', description: 'HR resources in the Documents module.', href: '/documents?category=hr' },
  { id: 'services', label: 'HR Services', description: 'HR services and requests.', href: '/hr' },
]

/** Curated groups for the Resources page. Targets are existing modules, so no document or form metadata is repeated. */
export const benefitResourceGroups: { id: string; title: string; description: string; links: { label: string; href: string }[] }[] = [
  {
    id: 'documents', title: 'Documents', description: 'Benefit documents are kept in the Documents module.',
    links: [
      { label: 'HR Documents', href: '/documents?category=hr' },
      { label: 'Benefits Guide (sample)', href: '/documents/doc-027' },
      { label: 'Employee Handbook (sample)', href: '/documents/doc-025' },
    ],
  },
  {
    id: 'forms', title: 'Forms & Requests', description: 'Benefit forms and requests use the Forms & Requests module.',
    links: [
      { label: 'All HR Forms', href: '/forms?category=hr' },
      { label: 'Benefits Inquiry', href: '/forms/rt-benefits' },
      { label: 'Benefits Information Request', href: '/forms/form-benefits-info' },
      { label: 'Benefits Assistance Request', href: '/forms/form-benefits-assistance' },
      { label: 'Benefits Request', href: '/forms/form-benefits-request' },
      { label: 'Other Benefits Request', href: '/forms/form-other-benefits' },
    ],
  },
  {
    id: 'services', title: 'HR Services', description: 'HR services and requests.',
    links: [
      { label: 'HR & Employee Services', href: '/hr' },
      { label: 'All HR Services', href: '/hr/services' },
      { label: 'My HR Requests', href: '/requests?category=hr' },
    ],
  },
]
