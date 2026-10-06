import type { DocumentAccessLevel, DocumentCategoryInfo, DocumentFileType, DocumentSort } from '@/types/document'

/** Category definitions. Will come from `GET /api/documents/categories` later. */
export const documentCategories: DocumentCategoryInfo[] = [
  {
    id: 'policies',
    label: 'Policies & Guidelines',
    description: 'Company policies, procedures, and employee guidelines.',
    href: '/documents/policies',
  },
  {
    id: 'forms',
    label: 'Forms',
    description: 'Employee request forms and internal forms.',
    href: '/documents/forms',
  },
  {
    id: 'templates',
    label: 'Templates',
    description: 'Standard company templates and document formats.',
    href: '/documents/templates',
  },
  {
    id: 'manuals',
    label: 'Manuals',
    description: 'Employee manuals, system manuals, and operational guides.',
    href: '/documents/manuals',
  },
  {
    id: 'hr',
    label: 'HR Resources',
    description: 'HR-related employee resources.',
    href: '/documents?category=hr',
  },
  {
    id: 'recruitment',
    label: 'Recruitment Resources',
    description: 'Recruitment guides, applicant instructions and referral information.',
    href: '/documents?category=recruitment',
  },
  {
    id: 'it',
    label: 'IT Resources',
    description: 'IT guides, troubleshooting documentation, and technical resources.',
    href: '/documents?category=it',
  },
  {
    id: 'company',
    label: 'Company Resources',
    description: 'General corporate resources.',
    href: '/documents?category=company',
  },
]

export const getCategoryInfo = (id: string) => documentCategories.find((c) => c.id === id)

export const fileTypeOptions: DocumentFileType[] = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX']

export const sortOptions: { value: DocumentSort; label: string }[] = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'added', label: 'Recently Added' },
  { value: 'az', label: 'A–Z' },
  { value: 'za', label: 'Z–A' },
]

export const accessLevelLabels: Record<DocumentAccessLevel, string> = {
  all: 'All Employees',
  department: 'Department Only',
  manager: 'Managers',
  restricted: 'Restricted',
}

export const DOCUMENT_PAGE_SIZE = 15
