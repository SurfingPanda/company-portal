import type {
  CompanyMilestone,
  CompanyProfile,
  Department,
  LeadershipMember,
  Location,
  OrganizationStructure,
} from '@/types/company'

/**
 * COMPANY CONTENT.
 *
 * Nothing here is verified company information unless its `status` is "official".
 * Every entry is currently "placeholder" and must be replaced with approved content from
 * Eljin Corporation management. Later this file is replaced by the Laravel `/api/company/*` responses.
 */

export const PENDING_TEXT = 'Information to be provided by Eljin Corporation.'
const DEPARTMENT_PENDING = 'Department description to be confirmed by Eljin Corporation.'

export const companyProfile: CompanyProfile = {
  name: 'Eljin Corporation',
  introductionTitle: 'About Eljin Corporation',
  introduction: {
    text: '[Company introduction will be provided by Corporate Management.]',
    status: 'placeholder',
  },
  mission: {
    text: 'Our mission statement will be provided by Eljin Corporation management.',
    status: 'placeholder',
  },
  vision: {
    text: 'Our vision statement will be provided by Eljin Corporation management.',
    status: 'placeholder',
  },
  // Draft list only. These are NOT confirmed as Eljin's official values.
  values: [
    { id: 'v1', title: 'Integrity', status: 'placeholder' },
    { id: 'v2', title: 'Accountability', status: 'placeholder' },
    { id: 'v3', title: 'Customer Focus', status: 'placeholder' },
    { id: 'v4', title: 'Teamwork', status: 'placeholder' },
    { id: 'v5', title: 'Continuous Improvement', status: 'placeholder' },
  ],
}

export const companyMilestones: CompanyMilestone[] = [
  { id: 'm1', title: 'Company established', description: 'Official milestone details will be provided.', status: 'placeholder' },
  { id: 'm2', title: 'Major company milestone', description: 'Official milestone details will be provided.', status: 'placeholder' },
  { id: 'm3', title: 'Expansion', description: 'Official milestone details will be provided.', status: 'placeholder' },
  { id: 'm4', title: 'New business development', description: 'Official milestone details will be provided.', status: 'placeholder' },
  { id: 'm5', title: 'Current operations', description: 'Official milestone details will be provided.', status: 'placeholder' },
]

export const leadershipMembers: LeadershipMember[] = [
  'a',
  'b',
  'c',
  'd',
].map((suffix) => ({
  id: `leader-${suffix}`,
  name: 'Executive Name',
  position: 'Position',
  biography: 'Official leadership profile will be added here.',
  status: 'placeholder' as const,
}))


export const departments: Department[] = [
  {
    id: 'management',
    name: 'Management',
    description: DEPARTMENT_PENDING,
    status: 'placeholder',
  },
  {
    id: 'hr',
    name: 'Human Resources',
    description: DEPARTMENT_PENDING,
    directoryFilter: 'Human Resources',
    status: 'placeholder',
  },
  {
    id: 'mis',
    name: 'MIS / Information Technology',
    description:
      "Responsible for the company's technology infrastructure, systems, technical support, and information services.",
    directoryFilter: 'MIS',
    status: 'placeholder',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: DEPARTMENT_PENDING,
    directoryFilter: 'Finance',
    status: 'placeholder',
  },
  {
    id: 'operations',
    name: 'Operations',
    description: DEPARTMENT_PENDING,
    directoryFilter: 'Operations',
    status: 'placeholder',
  },
  {
    id: 'sales',
    name: 'Sales',
    description: DEPARTMENT_PENDING,
    directoryFilter: 'Sales',
    status: 'placeholder',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: DEPARTMENT_PENDING,
    directoryFilter: 'Marketing',
    status: 'placeholder',
  },
  {
    id: 'administration',
    name: 'Administration',
    description: DEPARTMENT_PENDING,
    directoryFilter: 'Administration',
    status: 'placeholder',
  },
]

/** Illustrative hierarchy only, pending the official organizational chart. */
export const organizationStructure: OrganizationStructure = {
  status: 'placeholder',
  root: {
    id: 'corporate-management',
    label: 'Corporate Management',
    children: [
      { id: 'org-hr', label: 'Human Resources', children: [{ id: 'org-hr-team', label: 'HR Team' }] },
      { id: 'org-mis', label: 'MIS', children: [{ id: 'org-mis-team', label: 'IT Team' }] },
      { id: 'org-finance', label: 'Finance', children: [{ id: 'org-finance-team', label: 'Finance Team' }] },
      { id: 'org-operations', label: 'Operations', children: [{ id: 'org-operations-team', label: 'Operations Team' }] },
      { id: 'org-sales', label: 'Sales', children: [{ id: 'org-sales-team', label: 'Sales Team' }] },
      { id: 'org-marketing', label: 'Marketing', children: [{ id: 'org-marketing-team', label: 'Marketing Team' }] },
      { id: 'org-admin', label: 'Administration', children: [{ id: 'org-admin-team', label: 'Administration Team' }] },
    ],
  },
}

export const locations: Location[] = [
  {
    id: 'head-office',
    name: 'Head Office',
    address: '[Official address to be provided]',
    phone: '[Official contact information]',
    businessHours: '[Official business hours]',
    status: 'placeholder',
  },
  {
    id: 'branch',
    name: 'Branch / Location Name',
    address: 'Address to be provided',
    status: 'placeholder',
  },
  {
    id: 'warehouse',
    name: 'Warehouse / Facility Name',
    address: 'Address to be provided',
    status: 'placeholder',
  },
]
