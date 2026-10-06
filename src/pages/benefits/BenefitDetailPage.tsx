import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BenefitDetail } from '@/components/benefits/BenefitDetail'
import { HRErrorState } from '@/components/hr/HRStates'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getBenefit } from '@/services/benefitService'

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Benefit Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The benefit information you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/benefits">
          <ArrowLeft aria-hidden="true" /> Back to Benefits
        </Link>
      </Button>
    </div>
  )
}

export default function BenefitDetailPage() {
  const { benefitId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getBenefit(benefitId), [benefitId])

  const trail = [
    { label: 'HR & Employee Services', href: '/hr' },
    { label: 'Benefits & Employee Resources', href: '/benefits' },
    { label: data ? data.name : loading ? 'Loading…' : 'Not found' },
  ]

  let content
  if (error) content = <HRErrorState title="Unable to load this benefit" onRetry={retry} />
  else if (loading && !data) content = <Skeleton role="status" aria-label="Loading benefit" className="h-96 rounded-sm" />
  else if (!data) content = <NotFound />
  else content = <BenefitDetail key={data.id} benefit={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}
