import { HandHeart, Sparkles, Gift, MessageCircleHeart } from 'lucide-react'
import type { WhyChooseUsFeature, WhyChooseUsSectionProps } from '@/types/homepage'

const defaultFeatures: WhyChooseUsFeature[] = [
  {
    title: 'Fatto a mano con cura',
    description: 'Ogni pezzo è intrecciato a mano nel mio atelier, con filati scelti e finiture accurate.',
    icon: HandHeart,
  },
  {
    title: 'Personalizzabile',
    description: 'Colori, dimensioni e dettagli li decidiamo insieme, per una creazione davvero tua.',
    icon: Sparkles,
  },
  {
    title: 'Idee regalo speciali',
    description: 'Bouquet crochet, amigurumi e accessori pensati per sorprendere chi ami.',
    icon: Gift,
  },
  {
    title: 'Contatto diretto con l’artigiana',
    description: 'Scrivimi subito per dubbi o richieste: rispondo io, senza passaggi intermedi.',
    icon: MessageCircleHeart,
  },
]

export default function WhyChooseUsSection({ features = defaultFeatures }: WhyChooseUsSectionProps) {
  const featureList = (features ?? defaultFeatures) ?? []

  return (
    <section className="bg-white py-16 px-6 sm:py-20">
      <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
        <div className="text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
            Perché scegliere Mari’
          </p>
          <h2 className="text-3xl font-semibold text-[#1f1a17] sm:text-4xl">
            Filo dopo filo, una cura artigianale
          </h2>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">
            Scopri come trasformo un gomitolo in una creazione unica, pensata per te.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureList.map(feature => (
            <div
              key={feature.title}
              className="flex h-full flex-col gap-3 rounded-[24px] border border-neutral-200/70 bg-[#f8f5f0] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.07)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#c27b7f] shadow-inner">
                <feature.icon size={22} />
              </div>
              <h3 className="text-lg font-semibold text-[#1f1a17]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
