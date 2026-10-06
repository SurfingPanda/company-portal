import type { AnnouncementBlock } from '@/types/announcement'

export type KnowledgeBaseCategory = 'accounts' | 'microsoft-365' | 'network' | 'hardware' | 'printers' | 'security' | 'remote-work' | 'general'

/** Same structured, HTML-free blocks as announcements (heading, paragraph, list). */
export type KnowledgeBaseBlock = AnnouncementBlock

export interface KnowledgeBaseArticle {
  id: string
  title: string
  summary: string
  content: KnowledgeBaseBlock[]
  category: KnowledgeBaseCategory
  /** Include common issue keywords (e.g. "wi-fi", "vpn", "slow") so search finds the article. */
  tags: string[]
  /** ISO date-time. */
  updatedAt: string
  author?: string
  isFeatured?: boolean
  /** True for development sample articles that are generic guidance, not official Eljin procedures. */
  isSample?: boolean
}

export interface KnowledgeBaseQuery {
  search?: string
  category?: KnowledgeBaseCategory
}
