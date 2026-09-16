// Esempio: about-us/page.tsx
import React from "react"
import Layout from "@/components/native/Footer" // se vuoi usare layout globale, importa il tuo layout principale

export default function TermsPage() {
  return (
    <main className="bg-[#f8f6f2] text-neutral-900 min-h-screen">
      {/* Header se non incluso nel layout */}
      
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Terms and Conditions</h1>
        <p className="text-lg text-neutral-700">
          Qui puoi inserire la descrizione della tua sezione “Termini e Condizioni”.
        </p>
      </section>

      {/* Footer incluso se necessario */}
    </main>
  )
}