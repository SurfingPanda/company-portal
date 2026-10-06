/**
 * Company information types.
 *
 * Every piece of content carries a `status` so the UI can tell verified company information
 * ("official") apart from temporary development content ("placeholder").
 */

export type ContentStatus = 'official' | 'placeholder'

/** A block of text (introduction, mission, vision). */
export interface CompanyStatement {
  text: string
  status: ContentStatus
}

export interface CompanyProfile {
  name: string
  introductionTitle: string
  introduction: CompanyStatement
  mission: CompanyStatement
  vision: CompanyStatement
  values: CompanyValue[]
}

export interface CompanyValue {
  id: string
  title: string
  description?: string
  status: ContentStatus
}

export interface CompanyMilestone {
  id: string
  /** Leave undefined until the year is confirmed. */
  year?: string
  title: string
  description?: string
  status: ContentStatus
}

export interface LeadershipMember {
  id: string
  name: string
  position: string
  department?: string
  photoUrl?: string
  biography?: string
  status: ContentStatus
}

export interface Department {
  id: string
  name: string
  description: string
  /** Name of the department head, when confirmed. */
  head?: string
  employeeCount?: number
  /** Department name used by the Employee Directory filter, if the directory has one. */
  directoryFilter?: string
  status: ContentStatus
}

export interface Location {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  businessHours?: string
  /** Reserved for a future map embed or link. */
  mapUrl?: string
  status: ContentStatus
}

export interface OrganizationNode {
  id: string
  label: string
  /** Job title and department, shown after the name. */
  subtitle?: string
  /** Where the name links to (the person's directory profile). */
  href?: string
  children?: OrganizationNode[]
}

export interface OrganizationStructure {
  root: OrganizationNode
  status: ContentStatus
}

export interface CompanyOverviewData {
  profile: CompanyProfile
  milestones: CompanyMilestone[]
  leadership: LeadershipMember[]
  departments: Department[]
  locations: Location[]
}
