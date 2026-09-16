import Image from 'next/image'
import type { BrandStorySectionProps } from '@/types/homepage'

export default function BrandStorySection({ image }: BrandStorySectionProps) {
  return (
    <section className="bg-[#f8f5f0] px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl grid gap-12 sm:gap-16 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="relative h-[320px] overflow-hidden rounded-[32px] shadow-[0_18px_50px_rgba(0,0,0,0.14)] sm:h-[480px]">
          <Image
            src={image}
            alt="Mani all'opera nel laboratorio"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#5a4336]">
            Atelier Mari Handmade
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">La nostra storia</p>
          <h2 className="text-3xl font-semibold leading-tight text-[#1f1a17] sm:text-4xl">
            Mani che intrecciano emozioni
          </h2>
          <p className="text-lg leading-relaxed text-neutral-700">
            Ogni pezzo nasce nel mio laboratorio, tra gomitoli scelti e tanti appunti vissuti.
            Lavoro a mano, punto dopo punto, per creare oggetti che sappiano parlare di te o di
            chi li riceve.
          </p>
          <p className="text-lg leading-relaxed text-neutral-700">
            Credo nelle creazioni che durano, curate nei dettagli e personalizzate insieme a te:
            sono piccoli racconti da regalare o tenere vicino.
          </p>
        </div>
      </div>
    </section>
  )
}
