import type { AnnouncementBlock } from '@/types/announcement'

interface ContentBlocksProps {
  blocks: AnnouncementBlock[]
  /** Number the list items (steps) instead of using bullets. */
  ordered?: boolean
}

/**
 * Renders structured content (heading, paragraph, list) as ordinary React elements, in a comfortable
 * reading width. Shared by announcements and knowledge-base articles. No raw HTML is ever injected.
 */
export function ContentBlocks({ blocks, ordered = false }: ContentBlocksProps) {
  const ListTag = ordered ? 'ol' : 'ul'

  return (
    <div className="max-w-prose space-y-4 text-[0.9375rem] leading-relaxed text-foreground/90">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h2 key={index} className="pt-2 font-serif text-xl font-semibold text-primary">
              {block.text}
            </h2>
          )
        }
        if (block.type === 'list') {
          return (
            <ListTag key={index} className={ordered ? 'list-decimal space-y-1.5 pl-5' : 'list-disc space-y-1.5 pl-5'}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ListTag>
          )
        }
        return <p key={index}>{block.text}</p>
      })}
    </div>
  )
}
