import Image from 'next/image'
import Link from 'next/link'
import type { KitHighlightSectionProps } from '@/types/homepage'

const highlights = [
  'Filati selezionati e pronti da lavorare',
  'Schema dettagliato incluso nel kit',
  'Ideale anche per chi è alle prime armi',
]

export default function KitHighlightSection({ kitImage }: KitHighlightSectionProps) {
  return (
    <section className="bg-white py-20 px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 sm:gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f3ebe2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#5a4336]">
            Kit pronti da creare
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight text-[#1f1a17] sm:text-4xl">
              Kit curati da Mari Handmade
            </h2>
            <p className="text-lg leading-relaxed text-neutral-700">
              Ogni kit include tutto il necessario: gomitoli scelti, schema originale e piccoli
              accorgimenti che uso in atelier per guidarti passo dopo passo.
            </p>
          </div>

          <ul className="grid gap-3 text-sm font-medium text-[#2f2f2f] sm:grid-cols-2 sm:text-base">
            {highlights.map(item => (
              <li key={item} className="flex items-start gap-3 rounded-2xl bg-[#f8f5f0] p-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#c27b7f]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/kit"
              className="inline-flex items-center justify-center rounded-full bg-[#1f1a17] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#3a2f2a]"
            >
              Scopri i kit
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-[#1f1a17] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#1f1a17] transition hover:bg-[#f8f5f0]"
            >
              Richiedi informazioni
            </Link>
          </div>
        </div>

        <div className="relative h-[420px] overflow-hidden rounded-[32px] shadow-[0_18px_50px_rgba(0,0,0,0.14)] sm:h-[500px]">
          <Image
            src={kitImage}
            alt="Kit all'uncinetto Mari Handmade"
            fill
            className="object-cover transition duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  )
}
