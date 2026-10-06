import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

interface PlaceholderPageProps {
  title: string
  description: string
  /** Sentence shown in the body, e.g. "The Employee Directory will be available here." */
  message: string
}

/** Temporary page for sections that have not been built yet. */
export default function PlaceholderPage({ title, description, message }: PlaceholderPageProps) {
  return (
    <PageContainer className="pb-16">
      <PageHeader title={title} description={description} breadcrumbs={[{ label: title }]} />
      <section aria-label={`${title} status`} className="mt-8 border bg-white px-6 py-10 sm:px-10">
        <p className="font-serif text-xl font-semibold text-primary">{message}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          This section is being prepared. In the meantime, you can return to the portal home page for announcements,
          events and company systems.
        </p>
        <Button asChild variant="outline" className="mt-6 bg-white">
          <Link to="/">
            <ArrowLeft aria-hidden="true" /> Back to Home
          </Link>
        </Button>
      </section>
    </PageContainer>
  )
}
