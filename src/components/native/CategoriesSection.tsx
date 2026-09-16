import Image from 'next/image'
import Link from 'next/link'
import type { CategoriesSectionProps } from '@/types/homepage'

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section className="bg-[#f8f5f0] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-14">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
            Collezioni selezionate
          </p>
          <h2 className="text-3xl font-semibold leading-tight text-[#1f1a17] md:text-4xl">
            Scegli la tua creazione
          </h2>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">
            Pezzi unici lavorati all&apos;uncinetto, pensati per chi ama dettagli fatti a mano.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(category => (
            <Link
              key={category.id}
              href={category.slug}
              className="group relative overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
            >
              <div className="relative h-64 w-full sm:h-72">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  priority={false}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              </div>

              <div className="relative flex flex-col gap-3 px-6 pb-7 pt-5 sm:px-7">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#1f1a17] sm:text-2xl">
                    {category.title}
                  </h3>
                  <span className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">
                    Scopri
                  </span>
                </div>

                <p className="text-base text-neutral-600">{category.description}</p>

                <div className="flex items-center gap-3 text-sm font-semibold text-[#1f1a17]">
                  <span className="inline-flex items-center rounded-full bg-[#f3ebe2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5a4336]">
                    {category.cta ?? 'Vedi la collezione'}
                  </span>
                  <span aria-hidden className="transition duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
