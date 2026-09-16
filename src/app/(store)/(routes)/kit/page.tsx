import Link from "next/link"

export default function KitPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f2] text-neutral-900">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Kit Mari Handmade</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#1f1a17] sm:text-5xl">
          Kit all&apos;uncinetto curati in ogni dettaglio
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-neutral-700 sm:max-w-3xl">
          Trovi gomitoli selezionati, schema originale, accessori e note personali che uso
          in atelier. Scegli il kit che preferisci o scrivimi per ricevere una proposta su misura.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
          {[
            'Filati scelti e abbinati per un risultato armonioso',
            'Schema illustrato con spiegazioni passo-passo',
            'Adatto anche a chi è agli inizi',
            'Assistenza diretta: puoi scrivermi per dubbi o personalizzazioni',
          ].map(item => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm font-medium text-[#2f2f2f] shadow-[0_10px_35px_rgba(0,0,0,0.08)]"
            >
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#c27b7f]" aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[#1f1a17] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#3a2f2a]"
          >
            Richiedi informazioni kit
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center rounded-full border border-[#1f1a17] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#1f1a17] transition hover:bg-[#f8f5f0]"
          >
            Torna al catalogo
          </Link>
        </div>
      </section>
    </main>
  )
}
