'use client'

import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useEffect, useState } from 'react'
import { CarouselProps } from '@/types/homepage'

export default function Carousel({ images }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
    },
    [Autoplay({ delay: 4000 })]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    onSelect()
    emblaApi.on('select', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  return (
    <section className="w-full">
      <div ref={emblaRef} className="w-full overflow-hidden">
        <div className="flex">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative h-[220px] sm:h-[280px] md:h-[360px] flex-[0_0_33.3333%]"
            >
              <Image
                src={src}
                alt={`Slide ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              selectedIndex === i ? 'w-6 bg-black/80' : 'w-2.5 bg-black/25'
            }`}
            aria-label={`Vai alla slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}