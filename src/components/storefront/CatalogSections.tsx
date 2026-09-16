import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryDto, ProductDto } from "@/lib/api/contracts";
import {
  categoryVisuals,
  categoryCampaignKey,
  featuredEditorial,
  campaignCategoryHref,
} from "@/data/storefront";
import { getSafeImageSrc } from "@/lib/safe-image";
import {
  getPrimaryImageUrl,
  getVariantMinPrice,
  formatEuro,
  getCatalogCompareAtPrice,
} from "@/lib/product-display";
import { getAvailabilityLabel } from "@/lib/inventory-availability";
import { SectionHeading, Container } from "./layout";
import { MotionReveal } from "./MotionReveal";

export function CategoryTiles({
  categories,
}: {
  categories: CategoryDto[] | null;
}) {
  return (
    <section className="shop-categories" aria-label="Le collezioni">
      <MotionReveal>
        <SectionHeading
          eyebrow="Scegli la tua ispirazione"
          title="Un mondo di intrecci"
        />
      </MotionReveal>
      {categories === null ? (
        <p role="status">Collezioni temporaneamente non disponibili.</p>
      ) : categories.length === 0 ? (
        <p>Le nuove collezioni saranno disponibili qui.</p>
      ) : (
        <MotionReveal stagger className="shop-category-grid">
          {categories.map((category) => {
            const visual = categoryVisuals[categoryCampaignKey(category)];
            return (
              <Link
                key={category.id}
                href={`/categories/${encodeURIComponent(category.slug)}`}
                className="shop-category group"
              >
                <div className="shop-category-image">
                  <Image
                    src={getSafeImageSrc(
                      visual?.image ?? category.banners[0]?.image,
                      "/brand/logo.jpeg",
                    )}
                    alt={visual?.alt ?? category.title}
                    style={{
                      objectPosition: visual?.objectPosition ?? "center",
                    }}
                    fill
                    unoptimized={visual?.unoptimized}
                    sizes="(min-width: 1280px) 570px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="shop-category-copy">
                  <h3 className="font-serif text-4xl sm:text-5xl">
                    {category.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-shop-muted">
                    {visual?.copy ??
                      category.description ??
                      "Scopri le creazioni della collezione."}
                  </p>
                  <span className="shop-text-link mt-5">
                    {visual?.cta ?? `Scopri ${category.title}`}
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </MotionReveal>
      )}
    </section>
  );
}
export function CatalogProductCard({ product }: { product: ProductDto }) {
  const price = getVariantMinPrice(product);
  const compare = getCatalogCompareAtPrice(product);
  return (
    <article className="shop-product min-w-0">
      <Link
        href={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
        className="group block"
      >
        <div className="shop-product-image relative aspect-[4/5] overflow-hidden bg-shop-paper">
          <Image
            src={getPrimaryImageUrl(product)}
            alt={
              product.productImages.find((i) => i.isCover)?.altText ||
              product.title
            }
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-contain p-3 sm:p-5"
          />
          {product.isFeatured && (
            <span className="absolute left-3 top-3 bg-shop-paper px-2 py-1 text-xs text-shop-muted">
              In evidenza
            </span>
          )}
        </div>
        <div className="space-y-2 py-4">
          <p className="text-xs text-shop-muted">
            {product.categories.map((c) => c.title).join(" · ")}
          </p>
          <h3 className="text-base font-medium leading-6 group-hover:underline">
            {product.title}
          </h3>
          <p className="flex flex-wrap items-baseline gap-2 text-sm font-semibold">
            {product.variants.length > 1 && (
              <span className="font-normal">Da</span>
            )}
            {formatEuro(price)}
            {compare != null && compare > price && (
              <del className="font-normal text-shop-muted">
                {formatEuro(compare)}
              </del>
            )}
          </p>
          <p className="text-xs text-shop-muted">
            {getAvailabilityLabel(product)}
          </p>
          <span className="shop-product-link inline-block pt-2 text-sm underline underline-offset-4">
            Scopri il prodotto
          </span>
        </div>
      </Link>
    </article>
  );
}
export function FeaturedCatalog({
  products,
  categories = null,
  includeEditorial = true,
}: {
  products: ProductDto[] | null;
  categories?: CategoryDto[] | null;
  includeEditorial?: boolean;
}) {
  return (
    <>
      <section className="shop-featured">
        <MotionReveal>
          <SectionHeading
            eyebrow="Dal nostro atelier"
            title="Prodotti in evidenza"
          >
            <Link
              href="/products"
              className="text-sm underline underline-offset-4"
            >
              Tutte le creazioni
            </Link>
          </SectionHeading>
        </MotionReveal>
        {products === null ? (
          <p role="status">
            Il catalogo è temporaneamente non disponibile.{" "}
            <Link href="/products" className="underline">
              Riprova nel catalogo
            </Link>
          </p>
        ) : products.length === 0 ? (
          <p>
            Nessun prodotto in evidenza al momento.{" "}
            <Link href="/products" className="underline">
              Esplora il catalogo
            </Link>
          </p>
        ) : (
          <MotionReveal
            stagger
            className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4"
          >
            {products.map((p) => (
              <CatalogProductCard key={p.id} product={p} />
            ))}
          </MotionReveal>
        )}
      </section>
      {includeEditorial && <EditorialStories categories={categories} />}
    </>
  );
}

export function EditorialStories({
  categories,
}: {
  categories: CategoryDto[] | null;
}) {
  return (
    <section aria-label="Ispirazioni borse" className="shop-editorials">
      {featuredEditorial.map((story, index) => (
        <article
          key={story.id}
          className={`shop-story shop-story-${index + 1}`}
        >
          <Container>
            <MotionReveal stagger className="shop-story-grid">
              <div className="shop-story-visual">
                <div className="shop-story-image">
                  <Image
                    src={story.image}
                    alt={story.alt}
                    fill
                    sizes="(min-width: 1280px) 700px, (min-width: 768px) 60vw, 100vw"
                    style={{ objectPosition: story.objectPosition }}
                    className="object-cover"
                  />
                </div>
                <p className="shop-story-caption">
                  <span>Marì / Atelier</span>
                  <span>0{index + 1} — Dettagli da amare</span>
                </p>
              </div>
              <div className="shop-story-copy">
                <p className="shop-eyebrow">
                  {index === 0
                    ? "La bellezza delle piccole cose"
                    : "Una forma, mille possibilità"}
                </p>
                <h2>{story.title}</h2>
                <p className="shop-story-description">{story.copy}</p>
                <Link
                  href={campaignCategoryHref(categories, story.targetCategory)}
                  className="shop-text-link"
                >
                  {story.cta}
                  <ArrowRight size={18} />
                </Link>
              </div>
            </MotionReveal>
          </Container>
        </article>
      ))}
    </section>
  );
}
