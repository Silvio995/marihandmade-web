'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AtelierProps } from '@/types/homepage'

export default function Atelier({ images }: AtelierProps) {
  const mainImage = images[0]

  if (!mainImage) return null

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <motion.div
        initial={{ scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src={mainImage}
          alt="Atelier Mari'"
          fill
          priority
          className="object-cover"
        />
      </motion.div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 pb-8 pt-28 text-white md:px-10 md:pb-10 md:pt-32">
        {/* Headline area */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center">
          <div className="max-w-3xl">
            <motion.p
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-4 text-[11px] uppercase tracking-[0.35em] text-white/85 md:text-xs"
            >
              Atelier Mari’
            </motion.p>

            <motion.h1
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.95, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl text-4xl font-light leading-[1.05] md:text-6xl"
            >
              Bambole e creazioni
              <span className="block">all’uncinetto fatte a mano</span>
            </motion.h1>

            <motion.p
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.5 }}
              className="mt-6 max-w-xl text-sm leading-relaxed text-white/85 md:text-base"
            >
              Un atelier artigianale dove ogni creazione nasce con cura,
              delicatezza e identità.
            </motion.p>
          </div>
        </div>

        {/* Split CTA */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.75 }}
          className="mx-auto w-full max-w-7xl"
        >
          <div className="grid overflow-hidden border border-white/20 md:grid-cols-2">
            <Link
              href="/catalog"
              className="group relative flex min-h-[150px] flex-col justify-center bg-white/12 px-6 py-8 backdrop-blur-[2px] transition duration-500 hover:bg-white hover:text-black md:px-10"
            >
              <span className="text-[11px] uppercase tracking-[0.28em] text-white/70 transition duration-500 group-hover:text-black/60">
                Collezione
              </span>
              <span className="mt-3 text-2xl font-light md:text-3xl">
                Scopri i prodotti
              </span>
              <span className="mt-4 inline-block text-sm transition-transform duration-300 group-hover:translate-x-1">
                Entra nel catalogo →
              </span>
            </Link>

            <Link
              href="/contact"
              className="group relative flex min-h-[150px] flex-col justify-center border-t border-white/15 bg-black/18 px-6 py-8 backdrop-blur-[2px] transition duration-500 hover:bg-[#f5ede4] hover:text-black md:border-l md:border-t-0 md:px-10"
            >
              <span className="text-[11px] uppercase tracking-[0.28em] text-white/70 transition duration-500 group-hover:text-black/60">
                Atelier
              </span>
              <span className="mt-3 text-2xl font-light md:text-3xl">
                Richiedi una creazione
              </span>
              <span className="mt-4 inline-block text-sm transition-transform duration-300 group-hover:translate-x-1">
                Contattami →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}