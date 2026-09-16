 'use client'
export default function CatalogError({ reset }: { reset: () => void }) {
  return <section className="container py-16" role="alert"><h1 className="text-2xl">Contenuto temporaneamente non disponibile</h1><p className="my-4">Riprova tra qualche istante.</p><button className="underline" onClick={reset}>Riprova</button></section>
}
