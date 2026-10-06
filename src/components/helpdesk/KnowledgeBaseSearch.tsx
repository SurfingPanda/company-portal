import { HelpdeskSearch } from '@/components/helpdesk/HelpdeskSearch'

/** Live-filtering search for the knowledge base. A thin wrapper over the shared HelpdeskSearch. */
export function KnowledgeBaseSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <HelpdeskSearch id="kb-search" value={value} onChange={onChange} placeholder="Search the knowledge base..." label="Search knowledge-base articles" />
}
