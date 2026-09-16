import ContactWhatsappForm from "./components/contact-whatsapp-form"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#1f1a17]">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Mari Handmade Atelier</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Contattami</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-700">
          Scrivimi per ordini personalizzati, informazioni sui prodotti o richieste speciali.
          Ti rispondo su WhatsApp con una proposta su misura.
        </p>

        <div className="mt-12 rounded-3xl border border-[#e7e0d5] bg-white p-6 shadow-[0_18px_45px_rgba(35,25,18,0.08)] sm:p-8 lg:p-10">
          <ContactWhatsappForm />
        </div>
      </section>
    </main>
  )
}
