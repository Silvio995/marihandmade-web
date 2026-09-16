"use client"

import { FormEvent, useMemo, useState } from "react"

const WHATSAPP_PHONE = "393343462651"

const REQUEST_TYPES = [
  "Ordine personalizzato",
  "Informazioni prodotto",
  "Bouquet",
  "Amigurumi",
  "Altro",
] as const

export default function ContactWhatsappForm() {
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [requestType, setRequestType] = useState<(typeof REQUEST_TYPES)[number]>(REQUEST_TYPES[0])
  const [message, setMessage] = useState("")

  const whatsappText = useMemo(
    () =>
      [
        "Ciao, ti contatto dal sito Mari Handmade.",
        "",
        `Nome: ${name.trim()}`,
        `Contatto: ${contact.trim()}`,
        `Tipo richiesta: ${requestType}`,
        "",
        "Messaggio:",
        message.trim(),
      ].join("\n"),
    [contact, message, name, requestType]
  )

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim() || !contact.trim() || !message.trim()) {
      return
    }

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsappText)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <form className="grid gap-6 lg:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2d241f]" htmlFor="contact-name">
            Nome
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            required
            className="w-full rounded-2xl border border-[#d8ccbb] bg-[#fdfbf7] px-4 py-3 text-sm text-[#1f1a17] outline-none transition focus:border-[#b98c67] focus:ring-2 focus:ring-[#ecdcc7]"
            placeholder="Il tuo nome"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2d241f]" htmlFor="contact-reference">
            Contatto
          </label>
          <input
            id="contact-reference"
            name="contact"
            type="text"
            value={contact}
            onChange={event => setContact(event.target.value)}
            required
            placeholder="Email o telefono"
            className="w-full rounded-2xl border border-[#d8ccbb] bg-[#fdfbf7] px-4 py-3 text-sm text-[#1f1a17] outline-none transition focus:border-[#b98c67] focus:ring-2 focus:ring-[#ecdcc7]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2d241f]" htmlFor="request-type">
            Tipo richiesta
          </label>
          <select
            id="request-type"
            name="requestType"
            value={requestType}
            onChange={event =>
              setRequestType(event.target.value as (typeof REQUEST_TYPES)[number])
            }
            className="w-full rounded-2xl border border-[#d8ccbb] bg-[#fdfbf7] px-4 py-3 text-sm text-[#1f1a17] outline-none transition focus:border-[#b98c67] focus:ring-2 focus:ring-[#ecdcc7]"
          >
            {REQUEST_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2d241f]" htmlFor="contact-message">
            Messaggio
          </label>
          <textarea
            id="contact-message"
            name="message"
            value={message}
            onChange={event => setMessage(event.target.value)}
            required
            rows={10}
            className="w-full rounded-2xl border border-[#d8ccbb] bg-[#fdfbf7] px-4 py-3 text-sm text-[#1f1a17] outline-none transition focus:border-[#b98c67] focus:ring-2 focus:ring-[#ecdcc7]"
            placeholder="Raccontami cosa hai in mente..."
          />
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-[#1f1a17] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#3a2f2a] focus:outline-none focus:ring-2 focus:ring-[#d5b79b] focus:ring-offset-2"
        >
          Invia su WhatsApp
        </button>

        <p className="text-xs text-neutral-500">Verrai reindirizzato a WhatsApp con messaggio precompilato.</p>
      </div>
    </form>
  )
}
