import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JobList } from '@/components/recruitment/JobList'
import { JobSearch } from '@/components/recruitment/JobSearch'
import { RecruitmentEmptyState, RecruitmentErrorState, RecruitmentListSkeleton, RecruitmentNotice, RecruitmentSection, SAMPLE_JOBS_NOTICE } from '@/components/recruitment/RecruitmentEmptyState'
import { RecruitmentHeader } from '@/components/recruitment/RecruitmentHeader'
import { Button } from '@/components/ui/button'
import { RECRUITMENT_CONFIG } from '@/config/recruitment'
import { useAsync } from '@/hooks/useAsync'
import { getLatestJobs } from '@/services/recruitmentService'

const linkClass = 'shrink-0 text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline focus-visible:outline-2 focus-visible:outline-ring'
const rowClass = 'block px-4 py-3 text-sm font-medium text-primary hover:bg-accent hover:underline focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

const resources = [
  { label: 'Job Application', href: '/forms/rt-job-application' },
  { label: 'Employee Referral', href: '/forms/rt-employee-referral' },
  { label: 'Recruitment Forms', href: '/forms?category=recruitment' },
  { label: 'Recruitment Documents', href: '/documents?category=recruitment' },
  { label: 'HR Services', href: '/hr' },
]

export default function RecruitmentHomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, error, retry } = useAsync(() => getLatestJobs(5), [])

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(search.trim() ? `/recruitment/jobs?q=${encodeURIComponent(search.trim())}` : '/recruitment/jobs')
  }

  let openings
  if (error) openings = <RecruitmentErrorState onRetry={retry} />
  else if (!data) openings = <RecruitmentListSkeleton rows={4} label="Loading job openings" />
  else if (data.length === 0) openings = <RecruitmentEmptyState title="No Current Openings" message="There are no job openings available at this time." />
  else openings = <JobList jobs={data} />

  return (
    <RecruitmentHeader title="Recruitment & Careers" description="Explore opportunities at ELJIN CORPORATION.">
      <div className="space-y-10">
        <RecruitmentNotice>{SAMPLE_JOBS_NOTICE}</RecruitmentNotice>

        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row" aria-label="Search job openings">
          <div className="min-w-0 flex-1">
            <JobSearch value={search} onChange={setSearch} id="home-job-search" />
          </div>
          <Button type="submit" className="h-12 px-6">
            Search Jobs
          </Button>
        </form>

        <RecruitmentSection
          id="rec-openings-heading"
          title="Current Opportunities"
          action={
            <Link to="/recruitment/jobs" className={linkClass}>
              All Job Openings →
            </Link>
          }
        >
          {openings}
        </RecruitmentSection>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="min-w-0 space-y-10 lg:col-span-2">
            <RecruitmentSection id="rec-info-heading" title="Recruitment Information">
              <dl className="divide-y border bg-white text-sm">
                {[
                  ['Available positions', 'Open positions are listed under Job Openings. Search or filter by department, type, arrangement and location.'],
                  ['Application process', 'Open a position, choose Apply Now, complete the short form and attach your resume. Sample guidance until HR provides the official process.'],
                  ['Required information', 'Name, email, mobile number, years of experience and a resume (PDF, DOC or DOCX). No government IDs, bank or medical information is requested.'],
                  ['Recruitment contact', 'Recruitment contact information has not yet been configured for this portal.'],
                ].map(([term, detail]) => (
                  <div key={term} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{term}</dt>
                    <dd className="text-foreground/85">{detail}</dd>
                  </div>
                ))}
              </dl>
            </RecruitmentSection>

            <RecruitmentSection id="rec-referral-heading" title="Employee Referrals">
              <p className="max-w-3xl text-sm leading-relaxed text-foreground/85">
                If you know someone who may fit an open position, you can refer them from the position&apos;s page. Referrals are available for positions that have referrals enabled.
              </p>
              <Button asChild variant="outline" className="mt-3 bg-white">
                <Link to="/recruitment/jobs">Find a position to refer for</Link>
              </Button>
            </RecruitmentSection>
          </div>

          <div className="min-w-0 space-y-10">
            <RecruitmentSection id="rec-status-heading" title="Application Status">
              <div className="border bg-white p-4 text-sm">
                <p className="text-foreground/85">Track the applications you submitted through the portal.</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {RECRUITMENT_CONFIG.externalApplicationEnabled
                    ? 'Real application tracking is handled by the connected recruitment system.'
                    : 'Application tracking is not currently connected to a recruitment system. Applications shown are demo records.'}
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/recruitment/applications">My Applications</Link>
                </Button>
              </div>
            </RecruitmentSection>

            <RecruitmentSection id="rec-resources-heading" title="Recruitment Resources">
              <ul aria-label="Recruitment resources" className="divide-y border bg-white">
                {resources.map((r) => (
                  <li key={r.href}>
                    <Link to={r.href} className={rowClass}>
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </RecruitmentSection>
          </div>
        </div>
      </div>
    </RecruitmentHeader>
  )
}
