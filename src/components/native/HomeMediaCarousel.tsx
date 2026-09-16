'use client'

import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { HomeCarouselSlideContent } from '@/types/homepage'

interface Props {
  slides: HomeCarouselSlideContent[]
}

export function HomeMediaCarousel({ slides }: Props) {
  const safeSlides = slides ?? []
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 5200,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  ).current
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const plugins = useMemo(() => [autoplayPlugin], [autoplayPlugin])

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
      dragFree: false,
    },
    plugins
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches)
    onChange()
    mediaQuery.addEventListener('change', onChange)

    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    if (prefersReducedMotion) {
      autoplayPlugin.stop()
      return
    }

    autoplayPlugin.play()
  }, [autoplayPlugin, emblaApi, prefersReducedMotion])

  if (safeSlides.length === 0) return null

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <div ref={emblaRef} className="w-full overflow-hidden">
        <div className="flex h-[44vh] min-h-[320px] max-h-[430px] gap-0 sm:h-[50vh] md:h-[54vh] lg:h-[62vh] lg:min-h-[500px] lg:max-h-[680px] xl:h-[64vh]">
          {safeSlides.map((slide, i) => (
            <div
              key={slide.id}
              className="relative h-full w-full flex-[0_0_86vw] overflow-hidden sm:flex-[0_0_58vw] lg:flex-[0_0_36vw] xl:flex-[0_0_34vw]"
            >
              <Image
                src={slide.mobileImageUrl || slide.imageUrl}
                alt={slide.altText || `Slide ${i + 1}`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 86vw, (max-width: 1024px) 58vw, 34vw"
                priority={i < 2}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
