import { getProductGallery } from "@/lib/product-display";
import { getProductById } from "@/lib/api/catalog";
import type { ProductDto as ProductWithIncludes } from "@/lib/api/contracts";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DataSection } from "./components/data";
import ProductGallery from "./components/product-gallery";

type Props = {
  params: { productId: string };
};

export default async function Product({ params }: Props) {
  const product = await getProductById(params.productId);

  if (!product) {
    notFound();
  }

  const galleryImages = getProductGallery(product);
  const categories =
    product.categories?.map((category) => category.title).filter(Boolean) ?? [];
  const leadTimes = (product.variants ?? [])
    .map((variant) => variant.leadTimeDays)
    .filter((days): days is number => typeof days === "number" && days > 0);
  const minLeadTime = leadTimes.length > 0 ? Math.min(...leadTimes) : null;
  const maxLeadTime = leadTimes.length > 0 ? Math.max(...leadTimes) : null;

  return (
    <main className="min-h-screen bg-[#f6f6f6]">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-12">
        <Breadcrumbs product={product} />

        <section className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.22fr,0.78fr] lg:items-start">
          <ProductGallery images={galleryImages} productTitle={product.title} />
          <div className="flex flex-col gap-6 lg:sticky lg:top-28">
            <DataSection product={product} />
          </div>
        </section>

        <section className="mt-10">
          <div className="rounded-[14px] border border-neutral-200 bg-white shadow-sm">
            <DetailsRow title="Descrizione" defaultOpen>
              <p className="text-sm leading-relaxed text-neutral-700">
                {product.description ??
                  product.shortDescription ??
                  "Descrizione non ancora disponibile."}
              </p>
            </DetailsRow>
            <Divider />
            <DetailsRow title="Dettagli">
              <ul className="space-y-2 text-sm leading-relaxed text-neutral-700">
                {categories.length > 0 && (
                  <li>
                    Categoria:{" "}
                    {product.categories.map((category, index) => (
                      <span key={category.id}>
                        {index > 0 && " · "}
                        <Link
                          href={`/categories/${encodeURIComponent(category.slug)}`}
                          className="underline"
                        >
                          {category.title}
                        </Link>
                      </span>
                    ))}
                  </li>
                )}
                <li>
                  Personalizzazione:{" "}
                  {product.personalizationAllowed
                    ? "disponibile su richiesta"
                    : "non prevista"}
                </li>
                {product.fulfillmentMode && (
                  <li>
                    Realizzazione:{" "}
                    {
                      {
                        READY: "Pronta",
                        MADE_TO_ORDER: "Su ordinazione",
                        BOTH: "Pronta o su ordinazione",
                      }[product.fulfillmentMode]
                    }
                  </li>
                )}
              </ul>
            </DetailsRow>
            <Divider />
            <DetailsRow title="Cura e materiali">
              <p className="text-sm leading-relaxed text-neutral-700">
                Filati e componenti sono scelti con cura per garantire resa
                estetica e durata nel tempo. Conservare al riparo da umidità e
                luce diretta.
              </p>
            </DetailsRow>
            <Divider />
            <DetailsRow title="Tempi di preparazione e spedizione">
              <p className="text-sm leading-relaxed text-neutral-700">
                {minLeadTime != null && maxLeadTime != null
                  ? minLeadTime === maxLeadTime
                    ? `Tempi stimati: ${minLeadTime} giorni lavorativi.`
                    : `Tempi stimati: da ${minLeadTime} a ${maxLeadTime} giorni lavorativi.`
                  : "I tempi dipendono dalla disponibilità immediata o dalla produzione su ordinazione; vengono confermati prima del checkout."}
              </p>
            </DetailsRow>
          </div>
        </section>

        {/* Reviews await a backend HTTP contract; the legacy Prisma route is not mounted here. */}
      </div>
    </main>
  );
}

function Divider() {
  return <div className="h-px w-full bg-neutral-200" />;
}

function DetailsRow({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group px-6 py-4 sm:px-7" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 select-none">
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 group-open:hidden">
          Apri
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 hidden group-open:inline">
          Chiudi
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

const Breadcrumbs = ({ product }: { product: ProductWithIncludes }) => (
  <nav className="flex text-neutral-500" aria-label="Breadcrumb">
    <ol className="inline-flex items-center gap-2">
      <li>
        <Link href="/" className="text-sm font-medium hover:text-neutral-900">
          Home
        </Link>
      </li>
      <li>
        <ChevronRightIcon className="h-4" />
        <Link
          href="/products"
          className="text-sm font-medium hover:text-neutral-900"
        >
          Prodotti
        </Link>
      </li>
      <li aria-current="page">
        <ChevronRightIcon className="h-4" />
        <span className="text-sm font-medium text-neutral-900">
          {product.title}
        </span>
      </li>
    </ol>
  </nav>
);
