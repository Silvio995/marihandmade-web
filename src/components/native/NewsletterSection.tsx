import Link from "next/link";
import { Container } from "@/components/storefront/layout";
export default function NewsletterSection() {
  return (
    <section className="border-t border-shop-line bg-shop-sand py-12 sm:py-16">
      <Container className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-shop-brown">
            Lettere dall’atelier
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl">
            Restiamo in contatto.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-shop-muted">
            Novità, ispirazioni e piccoli racconti dal mondo Marì.
          </p>
        </div>
        <div>
          <p
            id="newsletter-status"
            className="mb-4 text-sm leading-6 text-shop-muted"
          >
            Le iscrizioni alla newsletter non sono ancora aperte. Nel frattempo,
            puoi scriverci per conoscere le nostre creazioni.
          </p>
          <fieldset
            disabled
            aria-describedby="newsletter-status"
            className="flex min-w-0 flex-col gap-3 sm:flex-row"
          >
            <legend className="sr-only">Newsletter — prossimamente</legend>
            <label htmlFor="newsletter-email" className="sr-only">
              La tua email
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="La tua email"
              className="h-12 min-w-0 flex-1 border border-shop-line bg-shop-paper px-4 text-sm"
            />
            <button className="h-12 bg-shop-line px-6 text-sm text-shop-muted">
              Prossimamente
            </button>
          </fieldset>
          <Link
            href="/contact"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            Contatta l’atelier
          </Link>
        </div>
      </Container>
    </section>
  );
}
