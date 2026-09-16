'use client'

import Atelier from '@/components/native/Atelier'
import { HeroProps } from '@/types/homepage'

export default function Hero({ images, logo }: HeroProps) {
  return (
    <section className="w-full">
      <Atelier images={images} />
    </section>
  )
}