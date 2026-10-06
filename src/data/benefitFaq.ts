import type { BenefitFAQ } from '@/types/benefit'

/**
 * SAMPLE DATA — Replace with HR-approved answers.
 * Answers are deliberately generic: they say where to look, never what ELJIN provides.
 * Replaced by `GET /api/benefits/faq` later.
 */
export const benefitFaqs: BenefitFAQ[] = [
  {
    id: 'faq-official-info', category: 'Information', question: 'Where can I view my official benefits information?',
    answer: "Official employee-specific benefits information should be requested from HR or found in HR-approved resources.",
  },
  {
    id: 'faq-submit-request', category: 'Requests', question: 'How do I submit a benefits-related request?',
    answer: 'Open the Benefits Request or Benefits Inquiry form from Forms & Requests. Your request gets a reference number and can be tracked under My Requests. HR reviews it; the portal does not decide on benefits.',
  },
  {
    id: 'faq-forms', category: 'Forms', question: 'Where can I find benefits forms?',
    answer: 'HR forms are listed under Forms & Requests (HR & Employee category). This is sample guidance until HR confirms which forms are official.',
  },
  {
    id: 'faq-contact', category: 'Contact', question: 'Who should I contact regarding benefits?',
    answer: 'Send an HR inquiry through the portal. Specific HR contact details have not yet been configured for this portal.',
  },
  {
    id: 'faq-documents', category: 'Documents', question: 'Where can I find the latest benefits documents?',
    answer: 'Benefits documents are kept in the Documents module under HR Resources. The sample benefits overview there is a placeholder.',
    relatedDocumentId: 'doc-027',
  },
  {
    id: 'faq-leave', category: 'Leave', question: 'Where do I request time off?',
    answer: 'File a leave request through the portal. Leave balances and official leave records are handled by HR.',
    relatedBenefitId: 'leave-resources',
  },
  {
    id: 'faq-sample', category: 'Information', question: 'Is the benefits information in this portal official?',
    answer: 'Not yet. Everything here is sample content until HR publishes approved information.',
  },
]
