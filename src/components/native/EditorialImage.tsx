'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

type EditorialImageProps = {
  src?: string | null
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
  fallbackLabel?: string
}

const FALLBACK_IMAGE = '/brand/logo.jpeg'

export default function EditorialImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  sizes,
  priority,
  fallbackLabel = 'Marì Atelier',
}: EditorialImageProps) {
  const [hasError, setHasError] = useState(false)

  const resolvedSrc = useMemo(() => {
    if (typeof src !== 'string') return FALLBACK_IMAGE
    const trimmed = src.trim()
    if (!trimmed) return FALLBACK_IMAGE
    return trimmed.startsWith('/') ? trimmed : FALLBACK_IMAGE
  }, [src])

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-end bg-[linear-gradient(145deg,#ece5db_0%,#d7c8b8_100%)] p-4">
        <span className="text-xs uppercase tracking-[0.2em] text-[#2f2621]/70">{fallbackLabel}</span>
      </div>
    )
  }

  if (fill) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width ?? 1400}
      height={height ?? 900}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setHasError(true)}
    />
  )
}
