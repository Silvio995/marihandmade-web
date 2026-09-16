import Link from 'next/link'

export default function CustomOrderSection() {
  return (
    <section className="bg-gradient-to-r from-[#f3ebe2] via-[#f8f5f0] to-[#f3ebe2] px-6 py-16 sm:py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-[32px] border border-[#e6d8cc] bg-white/70 p-8 shadow-[0_18px_50px_rgba(0,0,0,0.1)] sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Richieste su misura</p>
        <h2 className="text-3xl font-semibold leading-tight text-[#1f1a17] sm:text-4xl">
          Hai in mente qualcosa di unico?
        </h2>
        <p className="text-lg leading-relaxed text-neutral-700">
          Raccontami cosa desideri: un regalo personalizzato, un set coordinato per una festa,
          un pezzo speciale per un evento. Progetteremo insieme colori, forme e dettagli per
          consegnarti una creazione fatta a mano solo per te.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[#1f1a17] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#3a2f2a]"
          >
            Richiedi la tua creazione
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-[#1f1a17] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#1f1a17] transition hover:bg-[#f8f5f0]"
          >
            Scrivimi i dettagli
          </Link>
        </div>
      </div>
    </section>
  )
}
