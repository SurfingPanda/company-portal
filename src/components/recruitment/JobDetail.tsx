import { useState } from 'react'
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { JobStatus } from '@/components/recruitment/JobStatus'
import { RecruitmentNotice, SAMPLE_JOBS_NOTICE } from '@/components/recruitment/RecruitmentEmptyState'
import { Button } from '@/components/ui/button'
import { RECRUITMENT_CONFIG } from '@/config/recruitment'
import { formatDate } from '@/lib/format'
import { canApply, canRefer, getExternalApplicationUrl } from '@/lib/recruitment'
import { isJobSaved, toggleSavedJob } from '@/services/recruitmentService'
import type { JobOpening } from '@/types/recruitment'

const headingClass = 'border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary'

function BulletSection({ id, title, items }: { id: string; title: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={headingClass}>
        {title}
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

function Actions({ job }: { job: JobOpening }) {
  const [saved, setSaved] = useState(() => isJobSaved(job.id))
  const externalUrl = getExternalApplicationUrl(job)
  const systemName = RECRUITMENT_CONFIG.externalRecruitmentSystemName

  return (
    <div className="space-y-2">
      {canApply(job) ? (
        externalUrl ? (
          <Button asChild className="w-full">
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              Apply Now{systemName ? ` (${systemName})` : ''}
              <ExternalLink aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link to={`/recruitment/apply/${job.id}`}>Apply Now</Link>
          </Button>
        )
      ) : (
        <Button disabled className="w-full">
          Applications not available
        </Button>
      )}

      {canRefer(job) && (
        <Button asChild variant="outline" className="w-full bg-white">
          <Link to={`/recruitment/referral/${job.id}`}>Refer a Candidate</Link>
        </Button>
      )}

      <Button variant="outline" className="w-full bg-white" aria-pressed={saved} onClick={() => setSaved(toggleSavedJob(job.id))}>
        {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
        {saved ? 'Saved' : 'Save Job'}
      </Button>
    </div>
  )
}

/** Full job detail: header, summary sections, application information and actions. */
export function JobDetail({ job }: { job: JobOpening }) {
  const facts = [
    { label: 'Department', value: job.department },
    { label: 'Location', value: job.location },
    { label: 'Employment Type', value: job.employmentType },
    { label: 'Work Arrangement', value: job.workArrangement },
    { label: 'Posted', value: formatDate(job.postedAt, 'long') },
    { label: 'Closing Date', value: job.closingDate ? formatDate(job.closingDate, 'long') : 'Not specified' },
  ]

  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <JobStatus status={job.status} />
          {job.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-primary">{job.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {job.department} · {job.location} · {job.employmentType} · {job.workArrangement}
        </p>
      </header>

      {job.isSample && <RecruitmentNotice>{SAMPLE_JOBS_NOTICE}</RecruitmentNotice>}

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <section aria-labelledby="job-overview-heading">
            <h2 id="job-overview-heading" className={headingClass}>
              Position Overview
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{job.summary}</p>
          </section>
          <BulletSection id="job-resp-heading" title="Responsibilities" items={job.responsibilities} />
          <BulletSection id="job-qual-heading" title="Qualifications" items={job.qualifications} />
          <BulletSection id="job-pref-heading" title="Preferred Qualifications" items={job.preferredQualifications} />
          {job.skills && job.skills.length > 0 && (
            <section aria-labelledby="job-skills-heading">
              <h2 id="job-skills-heading" className={headingClass}>
                Skills
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <li key={skill} className="border bg-white px-2 py-1 text-xs font-medium text-foreground/80">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Button asChild variant="outline" className="bg-white">
            <Link to="/recruitment/jobs">
              <ArrowLeft aria-hidden="true" /> Back to Jobs
            </Link>
          </Button>
        </div>

        <div className="min-w-0 space-y-8">
          <section aria-labelledby="job-actions-heading">
            <h2 id="job-actions-heading" className={headingClass}>
              Actions
            </h2>
            <div className="mt-4">
              <Actions job={job} />
            </div>
          </section>

          <section aria-labelledby="job-facts-heading">
            <h2 id="job-facts-heading" className={headingClass}>
              Position Details
            </h2>
            <dl>
              {facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[8rem_1fr] gap-3 border-b border-border py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="job-apply-info-heading">
            <h2 id="job-apply-info-heading" className={headingClass}>
              Application Information
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">
              You may be asked for your name, email, mobile number, years of experience, relevant skills, an optional cover letter and a resume (PDF, DOC or DOCX). The portal does not ask for government ID numbers, bank details or medical information.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
