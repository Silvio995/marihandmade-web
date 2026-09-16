import Link from "next/link"

const VALUES = [
  {
    title: "Fatto a mano",
    description:
      "Ogni creazione nasce da gesti lenti e consapevoli, con tempi reali di lavorazione e attenzione autentica.",
  },
  {
    title: "Personalizzazione",
    description:
      "Ogni progetto puo essere adattato nei colori, nei dettagli e nello stile, per raccontare la tua storia.",
  },
  {
    title: "Cura del dettaglio",
    description:
      "Selezione dei materiali, finiture e proporzioni sono curate con precisione per un risultato elegante e armonioso.",
  },
] as const

const CREATIONS = [
  "Bouquet all'uncinetto",
  "Amigurumi",
  "Accessori handmade",
  "Creazioni personalizzate",
] as const

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#1f1a17]">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Marì Atelier</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Marì Atelier</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-700">
          Creazioni fatte a mano, pensate per raccontare emozioni.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8 sm:pb-12">
        <div className="rounded-3xl border border-[#e7e0d5] bg-white p-7 shadow-[0_18px_45px_rgba(35,25,18,0.08)] sm:p-10">
          <h2 className="text-2xl font-semibold text-[#1f1a17] sm:text-3xl">La mia storia</h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-700 sm:text-lg">
            Marì Atelier nasce dalla passione per il fatto a mano, l&apos;uncinetto e le creazioni
            personalizzate. Ogni pezzo prende forma con tempo, cura e una ricerca continua di
            equilibrio tra delicatezza e carattere.
          </p>
          <p className="mt-4 text-base leading-relaxed text-neutral-700 sm:text-lg">
            Lavoro con materiali scelti con attenzione e dedico valore ai dettagli: dalla palette
            cromatica alle finiture finali. Il risultato e sempre una creazione unica, pensata per
            accompagnare emozioni, occasioni speciali e ricordi da custodire.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-12">
        <h2 className="text-2xl font-semibold text-[#1f1a17] sm:text-3xl">Valori</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(value => (
            <article
              key={value.title}
              className="rounded-2xl border border-[#e8dece] bg-[#fffdf9] p-6 shadow-[0_10px_25px_rgba(35,25,18,0.06)]"
            >
              <h3 className="text-lg font-semibold text-[#2a211c]">{value.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-12">
        <div className="rounded-3xl border border-[#eadfcf] bg-[#fdfbf7] p-7 sm:p-10">
          <h2 className="text-2xl font-semibold text-[#1f1a17] sm:text-3xl">Cosa creo</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {CREATIONS.map(item => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#2f2f2f] shadow-[0_8px_20px_rgba(35,25,18,0.05)]"
              >
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#c27b7f]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-8 sm:pb-20 sm:pt-12">
        <div className="rounded-3xl border border-[#dfd2c0] bg-white p-7 text-center shadow-[0_16px_35px_rgba(35,25,18,0.08)] sm:p-10">
          <p className="text-2xl font-semibold leading-tight text-[#1f1a17] sm:text-3xl">
            Hai in mente una creazione speciale?
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
            Raccontami la tua idea: saro felice di aiutarti a trasformarla in una creazione su
            misura.
          </p>
          <Link
            href="/contact"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-[#1f1a17] px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#3a2f2a]"
          >
            Scrivimi
          </Link>
        </div>
      </section>
    </main>
  )
}
