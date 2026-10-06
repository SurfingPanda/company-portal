import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NewsImageProps {
  src?: string
  alt: string
  className?: string
}

/** Image with a neutral hatched placeholder when no photo is supplied or loading fails. Size it via className. */
export function NewsImage({ src, alt, className }: NewsImageProps) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className={cn('relative aspect-[3/2] overflow-hidden bg-muted', className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (photo to be added)`}
          className="flex size-full items-end bg-[repeating-linear-gradient(135deg,transparent_0_9px,rgba(13,27,76,0.06)_9px_10px)] p-3"
        >
          <span className="font-serif text-sm font-semibold tracking-[0.2em] text-primary/35">ELJIN</span>
        </div>
      )}
    </div>
  )
}
