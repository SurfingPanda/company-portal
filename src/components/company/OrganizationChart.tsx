import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Minus, Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OrganizationNode, OrganizationStructure } from '@/types/company'

/** Levels shown when the page first opens: the top person, their managers, and the teams under them. */
const OPEN_LEVELS = 3

const hasKids = (node: OrganizationNode) => (node.children?.length ?? 0) > 0
const countAll = (node: OrganizationNode): number => 1 + (node.children ?? []).reduce((sum, c) => sum + countAll(c), 0)

/** Ids of every node that has people under it, optionally only down to a depth. */
function branchIds(node: OrganizationNode, depth = 0, maxDepth = Infinity, out = new Set<string>()): Set<string> {
  if (hasKids(node) && depth <= maxDepth) {
    out.add(node.id)
    node.children?.forEach((c) => branchIds(c, depth + 1, maxDepth, out))
  }
  return out
}

interface TreeProps {
  node: OrganizationNode
  depth: number
  open: Set<string>
  toggle: (id: string) => void
}

// --- Wide screens: a top-down tree -----------------------------------------------------------------------------------------

function Card({ node, depth, open, toggle }: TreeProps) {
  const kids = node.children?.length ?? 0
  const isOpen = open.has(node.id)
  const body = (
    <>
      <span className="block text-sm font-semibold leading-tight">{node.label}</span>
      {node.subtitle && <span className={cn('mt-0.5 block text-[0.6875rem] leading-snug', depth === 0 ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{node.subtitle}</span>}
    </>
  )
  const style = cn(
    'block w-44 border px-3 py-2 text-center',
    depth === 0 ? 'border-primary bg-primary text-primary-foreground' : kids > 0 ? 'border-primary/50 bg-white text-primary' : 'bg-white text-foreground',
  )

  return (
    <div className="flex flex-col items-center">
      {node.href ? (
        <Link to={node.href} className={cn(style, 'hover:border-primary focus-visible:outline-2 focus-visible:outline-ring')}>{body}</Link>
      ) : (
        <span className={style}>{body}</span>
      )}
      {kids > 0 && (
        <button
          type="button"
          onClick={() => toggle(node.id)}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? 'Hide' : 'Show'} ${kids} ${kids === 1 ? 'person' : 'people'} reporting to ${node.label}`}
          className="-mb-px mt-1 inline-flex items-center gap-1 rounded-sm border bg-white px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          {isOpen ? <Minus className="size-3" aria-hidden="true" /> : <Plus className="size-3" aria-hidden="true" />}
          <Users className="size-3" aria-hidden="true" />
          {kids}
        </button>
      )}
    </div>
  )
}

function TreeNode({ node, depth, open, toggle }: TreeProps) {
  const children = node.children ?? []
  const showKids = children.length > 0 && open.has(node.id)
  // People who manage nobody hang in a column under their manager; only managers are laid out side by side, so the tree stays narrow.
  const branches = children.filter(hasKids)
  const leaves = children.filter((c) => !hasKids(c))

  return (
    <div className="flex flex-col items-center">
      <Card node={node} depth={depth} open={open} toggle={toggle} />
      {showKids && (
        <>
          <span aria-hidden="true" className="h-4 w-px bg-border" />
          {leaves.length > 0 && (
            <ul className="mb-4 flex flex-col gap-1.5 border-l pl-3" aria-label={`People reporting to ${node.label}`}>
              {leaves.map((leaf) => (
                <li key={leaf.id}>
                  <Card node={leaf} depth={depth + 1} open={open} toggle={toggle} />
                </li>
              ))}
            </ul>
          )}
          {branches.length > 0 && (
            <ul className="flex items-start" aria-label={`${leaves.length > 0 ? 'Managers' : 'People'} reporting to ${node.label}`}>
              {branches.map((child, index) => (
                <li
                  key={child.id}
                  className={cn(
                    'relative flex flex-col items-center px-2 pt-4',
                    'before:absolute before:left-0 before:top-0 before:h-4 before:w-1/2 before:border-r before:border-t',
                    'after:absolute after:right-0 after:top-0 after:h-4 after:w-1/2 after:border-t',
                    branches.length === 1 && 'before:border-t-0 after:border-t-0',
                    branches.length > 1 && index === 0 && 'before:border-t-0',
                    branches.length > 1 && index === branches.length - 1 && 'after:border-t-0',
                  )}
                >
                  <TreeNode node={child} depth={depth + 1} open={open} toggle={toggle} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

// --- Small screens: an indented list ---------------------------------------------------------------------------------------

function ListNode({ node, depth, open, toggle }: TreeProps) {
  const children = node.children ?? []
  const isOpen = open.has(node.id)
  const name = node.href ? (
    <Link to={node.href} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{node.label}</Link>
  ) : (
    <span className={cn('font-medium', depth === 0 ? 'text-primary' : 'text-foreground')}>{node.label}</span>
  )

  return (
    <li>
      <div className="flex items-start gap-1 py-1">
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Hide' : 'Show'} ${children.length} ${children.length === 1 ? 'person' : 'people'} under ${node.label}`}
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ChevronRight className={cn('size-4 transition-transform', isOpen && 'rotate-90')} aria-hidden="true" />
          </button>
        ) : (
          <span className="size-5 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 text-sm">
          {name}
          {node.subtitle && <span className="text-muted-foreground"> · {node.subtitle}</span>}
          {children.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" aria-hidden="true" />
              {children.length}
            </span>
          )}
        </div>
      </div>
      {children.length > 0 && isOpen && (
        <ul className="ml-2.5 border-l pl-3">
          {children.map((child) => (
            <ListNode key={child.id} node={child} depth={depth + 1} open={open} toggle={toggle} />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * The organizational structure, drawn from the reporting lines HR keeps on the employee records: the top person first, then
 * their managers, then the people under them. Wide screens show a top-down tree (a manager with many direct reports lists the
 * people who manage nobody in a column, so the tree stays narrow); small screens show an indented list. Every branch opens and
 * closes, so a large company stays readable.
 */
export function OrganizationChart({ structure }: { structure: OrganizationStructure }) {
  const [open, setOpen] = useState(() => branchIds(structure.root, 0, OPEN_LEVELS - 1))
  const total = useMemo(() => countAll(structure.root), [structure.root])
  const people = total - (structure.root.id === 'company' ? 1 : 0)
  const scroller = useRef<HTMLDivElement>(null)

  // A tree wider than the page starts centred on the top person instead of at its far left edge.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
  }, [structure.root])

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <figure aria-label="Organizational structure" className="border bg-white p-5">
      {structure.status === 'placeholder' && (
        <figcaption className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <PlaceholderTag /> Illustrative structure until HR records who reports to whom.
        </figcaption>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{structure.status === 'placeholder' ? 'Departments' : `${people} ${people === 1 ? 'person' : 'people'}`}</span>
        <span className="flex gap-2">
          <Button type="button" size="sm" variant="outline" className="h-7 bg-white px-2 text-xs" onClick={() => setOpen(branchIds(structure.root))}>Expand all</Button>
          <Button type="button" size="sm" variant="outline" className="h-7 bg-white px-2 text-xs" onClick={() => setOpen(new Set())}>Collapse all</Button>
        </span>
      </div>
      <div ref={scroller} className="hidden overflow-x-auto pb-2 lg:block">
        <div className="mx-auto flex w-max min-w-full justify-center">
          <TreeNode node={structure.root} depth={0} open={open} toggle={toggle} />
        </div>
      </div>
      <ul className="lg:hidden">
        <ListNode node={structure.root} depth={0} open={open} toggle={toggle} />
      </ul>
    </figure>
  )
}
