import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileUp } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthorization } from '@/auth/useAuthorization'
import { getApiErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { adminApi } from '@/services/admin/adminApi'

interface RowIssue { line: number; employee_id: string; display_name: string; messages: string[] }
interface Preview {
  total: number
  ready: number
  ready_sample: { line: number; employee_id: string; display_name: string; company_email: string; job_title: string; department: string; role: string }[]
  existing: { line: number; employee_id: string }[]
  errors: RowIssue[]
  ignored_columns: string[]
}
interface Outcome {
  created: number
  logins_created: number
  logins_linked: number
  failed: { line: number; employee_id: string; reason: string }[]
  skipped_existing: number
  errors: RowIssue[]
}

const TEMPLATE_HEADER = 'employee_id,display_name,company_email,job_title,department,location,employment_status,employment_type,date_joined,manager_employee_id,phone,role'
const TEMPLATE_ROWS = [
  'EMP-1001,Ana Cruz,ana.cruz@eljin.example,Accountant,Finance,Head Office,active,regular,2024-05-06,EMP-1002,0917 123 4567,Regular Employee',
  'EMP-1002,Ben Lim,ben.lim@eljin.example,Finance Manager,Finance,Head Office,active,regular,2020-01-15,,,Manager',
]

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`

/** Saves text as a file in the browser. Nothing is sent anywhere. */
function downloadCsv(filename: string, lines: string[]) {
  const url = URL.createObjectURL(new Blob([`﻿${lines.join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const heading = 'border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary'

/** HR: load many employee records from a CSV file. Check first (nothing is saved), then import. */
export default function ImportEmployeesPage() {
  const { hasPermission } = useAuthorization()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [createLogins, setCreateLogins] = useState(true)
  const [makeVisible, setMakeVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [confirm, setConfirm] = useState(false)

  const form = () => {
    const body = new FormData()
    if (file) body.append('file', file)
    body.append('create_logins', createLogins ? '1' : '0')
    if (makeVisible) body.append('make_visible', '1')
    return body
  }

  const fail = (e: unknown) => setError(getFieldErrors(e).file ?? getApiErrorMessage(e))

  const check = async () => {
    if (!file) return
    setBusy(true)
    setError(undefined)
    setOutcome(null)
    try {
      setPreview(await adminApi.upload<Preview>('/api/admin/hr/employees/import/preview', form()))
    } catch (e) {
      setPreview(null)
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  const run = async () => {
    setBusy(true)
    setError(undefined)
    try {
      setOutcome(await adminApi.upload<Outcome>('/api/admin/hr/employees/import', form()))
      setPreview(null)
      setConfirm(false)
    } catch (e) {
      setConfirm(false)
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setOutcome(null)
    setError(undefined)
    if (input.current) input.current.value = ''
  }

  const reportIssues = (issues: RowIssue[], failed: Outcome['failed'] = []) => [
    'line,employee_id,display_name,problem',
    ...issues.flatMap((i) => i.messages.map((m) => [i.line, i.employee_id, i.display_name, m].map(csvCell).join(','))),
    ...failed.map((f) => [f.line, f.employee_id, '', f.reason].map(csvCell).join(',')),
  ]

  return (
    <>
      <AdminPageHeader
        title="Import employees"
        description="Load many employee records from a CSV file instead of typing them one by one."
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Employee Directory', href: '/admin/hr/employees' }, { label: 'Import' }]}
      />

      {!outcome && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section aria-labelledby="imp-file">
              <h2 id="imp-file" className={heading}>1. Choose your file</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input ref={input} id="import-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setError(undefined) }} />
                <Button type="button" variant="outline" className="bg-white" onClick={() => input.current?.click()}><FileUp aria-hidden="true" /> {file ? 'Choose another file' : 'Choose CSV file'}</Button>
                <span className="text-sm text-muted-foreground">{file ? file.name : 'No file chosen'}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Up to 1,000 employees and 1 MB. Excel: use File → Save As → CSV.</p>

              <div className="mt-4 space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={createLogins} onCheckedChange={(c) => setCreateLogins(c === true)} className="mt-0.5" />
                  <span>Create a login for each employee and email them a link to choose their password<br /><span className="text-xs text-muted-foreground">The company email becomes their sign-in name. Untick to add records only; logins can be created later.</span></span>
                </label>
                {hasPermission('hr.directory.visibility') && (
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={makeVisible} onCheckedChange={(c) => setMakeVisible(c === true)} className="mt-0.5" />
                    <span>Show the imported employees in the Employee Directory<br /><span className="text-xs text-muted-foreground">Left unticked, they stay hidden until you show them.</span></span>
                  </label>
                )}
              </div>

              <Button type="button" className="mt-4" disabled={!file || busy} onClick={() => void check()}>{busy && !preview ? 'Checking…' : 'Check file'}</Button>
              {error && <p role="alert" className="mt-3 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            </section>

            {preview && (
              <section aria-labelledby="imp-check">
                <h2 id="imp-check" className={heading}>2. Check the result</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                  <li className="border bg-white p-4"><p className="font-serif text-3xl font-semibold text-primary">{preview.ready}</p><p className="text-sm text-muted-foreground">ready to import</p></li>
                  <li className="border bg-white p-4"><p className="font-serif text-3xl font-semibold text-primary">{preview.existing.length}</p><p className="text-sm text-muted-foreground">already exist (will be skipped)</p></li>
                  <li className="border bg-white p-4"><p className={`font-serif text-3xl font-semibold ${preview.errors.length ? 'text-destructive' : 'text-primary'}`}>{preview.errors.length}</p><p className="text-sm text-muted-foreground">with problems (will be skipped)</p></li>
                </ul>
                {preview.ignored_columns.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Ignored columns: {preview.ignored_columns.join(', ')}</p>}

                {preview.errors.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-destructive">Rows to fix</h3>
                      <Button type="button" size="sm" variant="outline" className="bg-white" onClick={() => downloadCsv('import-problems.csv', reportIssues(preview.errors))}><Download aria-hidden="true" /> Download problems</Button>
                    </div>
                    <div className="mt-2 max-h-80 overflow-auto border bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-2">Line</th><th className="p-2">Employee</th><th className="p-2">Problem</th></tr></thead>
                        <tbody>
                          {preview.errors.map((r) => (
                            <tr key={r.line} className="border-t align-top">
                              <td className="p-2 font-mono">{r.line}</td>
                              <td className="p-2">{r.employee_id || '—'}<br /><span className="text-xs text-muted-foreground">{r.display_name}</span></td>
                              <td className="p-2"><ul className="list-disc pl-4">{r.messages.map((m) => <li key={m}>{m}</li>)}</ul></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Fix these in your file and check it again, or import the ready rows now and upload the corrected rows later (existing employees are always skipped).</p>
                  </div>
                )}

                {preview.ready_sample.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold">First {preview.ready_sample.length} ready rows</h3>
                    <ul className="mt-2 divide-y border bg-white text-sm">
                      {preview.ready_sample.map((r) => <li key={r.employee_id} className="px-3 py-2"><span className="font-mono text-xs">{r.employee_id}</span> {r.display_name} <span className="text-muted-foreground">· {r.company_email}{r.job_title ? ` · ${r.job_title}` : ''}{r.department ? ` · ${r.department}` : ''} · {r.role === 'manager' ? 'Manager' : 'Regular Employee'}</span></li>)}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="button" disabled={preview.ready === 0 || busy} onClick={() => setConfirm(true)}>Import {preview.ready} employee{preview.ready === 1 ? '' : 's'}</Button>
                  <Button type="button" variant="outline" className="bg-white" onClick={reset}>Start over</Button>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-3 text-sm lg:col-span-1">
            <h2 className={heading}>File format</h2>
            <p>One row per employee. The first row is the column names. Required: <strong>employee_id</strong>, <strong>display_name</strong>, <strong>company_email</strong>.</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li><strong>department</strong> and <strong>location</strong>: the exact name of one that already exists.</li>
              <li><strong>employment_status</strong>: active, on leave or inactive (default active).</li>
              <li><strong>employment_type</strong>: regular, probationary, contractual or part time.</li>
              <li><strong>date_joined</strong>: year-month-day, e.g. 2024-05-06.</li>
              <li><strong>manager_employee_id</strong>: the employee ID of their manager (anywhere in the file, or already in the portal).</li>
              <li><strong>role</strong>: Regular Employee (default) or Manager.</li>
            </ul>
            <Button type="button" variant="outline" className="bg-white" onClick={() => downloadCsv('employee-import-template.csv', [TEMPLATE_HEADER, ...TEMPLATE_ROWS])}><Download aria-hidden="true" /> Download template</Button>
            <p className="text-xs text-muted-foreground">Employees whose ID already exists are never changed by an import.</p>
          </aside>
        </div>
      )}

      {outcome && (
        <section aria-labelledby="imp-done" role="status">
          <h2 id="imp-done" className={heading}>Import finished</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-4">
            <li className="border bg-white p-4"><p className="font-serif text-3xl font-semibold text-primary">{outcome.created}</p><p className="text-sm text-muted-foreground">employees added</p></li>
            <li className="border bg-white p-4"><p className="font-serif text-3xl font-semibold text-primary">{outcome.logins_created + outcome.logins_linked}</p><p className="text-sm text-muted-foreground">logins ready{createLogins ? ' (emails sent)' : ''}</p></li>
            <li className="border bg-white p-4"><p className="font-serif text-3xl font-semibold text-primary">{outcome.skipped_existing}</p><p className="text-sm text-muted-foreground">already existed</p></li>
            <li className="border bg-white p-4"><p className={`font-serif text-3xl font-semibold ${outcome.errors.length + outcome.failed.length ? 'text-destructive' : 'text-primary'}`}>{outcome.errors.length + outcome.failed.length}</p><p className="text-sm text-muted-foreground">not imported</p></li>
          </ul>
          {outcome.errors.length + outcome.failed.length > 0 && (
            <Button type="button" variant="outline" className="mt-4 bg-white" onClick={() => downloadCsv('import-problems.csv', reportIssues(outcome.errors, outcome.failed))}><Download aria-hidden="true" /> Download the rows that were not imported</Button>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild><Link to="/admin/hr/employees">View employee records</Link></Button>
            <Button type="button" variant="outline" className="bg-white" onClick={reset}>Import another file</Button>
          </div>
        </section>
      )}

      <ConfirmDialog open={confirm} title={`Import ${preview?.ready ?? 0} employees?`} reversible={false} confirmLabel="Import" busy={busy} onConfirm={() => void run()} onCancel={() => setConfirm(false)}>
        <p>{preview?.ready} employee record(s) will be added{createLogins ? ', each with a login and an email so they can choose their own password' : ' without logins'}{makeVisible ? ', and shown in the Employee Directory' : ', hidden from the Employee Directory until you show them'}. Rows with problems and employees that already exist are skipped.</p>
      </ConfirmDialog>
    </>
  )
}
