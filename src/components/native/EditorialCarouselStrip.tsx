'use client'

import type { EditorialImageItem } from '@/data/homepage-editorial'
import EditorialImage from '@/components/native/EditorialImage'
import { useEffect, useRef } from 'react'

type EditorialCarouselStripProps = {
  slides: EditorialImageItem[]
}

export default function EditorialCarouselStrip({ slides }: EditorialCarouselStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container || slides.length < 2) return

    const tick = () => {
      if (pausedRef.current) return

      const firstSlide = container.querySelector<HTMLElement>('[data-slide]')
      const step = (firstSlide?.clientWidth ?? Math.round(container.clientWidth * 0.88)) + 1
      const maxScrollLeft = container.scrollWidth - container.clientWidth
      const nextLeft = container.scrollLeft + step

      if (nextLeft >= maxScrollLeft - 2) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }

      container.scrollTo({ left: nextLeft, behavior: 'smooth' })
    }

    const intervalId = window.setInterval(tick, 4200)
    return () => window.clearInterval(intervalId)
  }, [slides.length])

  return (
    <section aria-label="Editorial carousel" className="border-y border-[#d9c9b8] bg-[#efe6db]">
      <div
        ref={containerRef}
        className="mx-auto flex w-full max-w-[1800px] snap-x snap-mandatory gap-px overflow-x-auto overscroll-x-contain px-0 py-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseEnter={() => {
          pausedRef.current = true
        }}
        onMouseLeave={() => {
          pausedRef.current = false
        }}
        onTouchStart={() => {
          pausedRef.current = true
        }}
        onTouchEnd={() => {
          pausedRef.current = false
        }}
      >
        {slides.map((slide, index) => (
          <article
            key={`${slide.src}-${index}`}
            data-slide
            className="group relative h-[360px] min-w-[88vw] snap-start overflow-hidden bg-[#ddcfc0] sm:min-w-[62vw] md:h-[420px] md:min-w-[40vw] lg:h-[460px] lg:min-w-[32vw] xl:min-w-[28vw]"
          >
            <EditorialImage
              src={slide.src}
              alt={slide.alt}
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
              sizes="(min-width: 1536px) 28vw, (min-width: 1024px) 32vw, (min-width: 768px) 40vw, 88vw"
              fallbackLabel="Marì Atelier"
            />
          </article>
        ))}
      </div>
    </section>
  )
}
