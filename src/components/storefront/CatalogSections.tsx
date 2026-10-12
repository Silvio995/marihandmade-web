import WishlistButton from "@/components/native/WishlistButton";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryDto, ProductDto } from "@/lib/api/contracts";
import { featuredEditorial, campaignCategoryHref } from "@/data/storefront";
import {
  collectionEditorialImages,
  homepageEditorialContent,
} from "@/data/homepage-editorial";
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
  const { collections } = homepageEditorialContent;
  return (
    <section
      id="collezioni"
      className="atelier-collections"
      aria-labelledby="collections-title"
    >
      <div className="atelier-collections-inner">
        <div className="space-y-4">
          <p className="atelier-eyebrow">{collections.eyebrow}</p>
          <h2 id="collections-title" className="atelier-heading">
            {collections.title}
          </h2>
          <p className="max-w-3xl text-base text-[#4f4035]">
            {collections.subtitle}
          </p>
        </div>
        {categories === null ? (
          <p role="status">Collezioni temporaneamente non disponibili.</p>
        ) : categories.length === 0 ? (
          <p>Le nuove collezioni saranno disponibili qui.</p>
        ) : (
          <div className="atelier-collection-grid">
            {categories.map((category) => {
              const visual =
                collectionEditorialImages[category.slug] ??
                collectionEditorialImages[
                  category.title.toLocaleLowerCase("it")
                ];
              return (
                <Link
                  key={category.id}
                  href={`/categories/${encodeURIComponent(category.slug)}`}
                  aria-label={`Scopri ${category.title}`}
                  className="atelier-collection"
                >
                  <Image
                    src={getSafeImageSrc(
                      visual?.image ?? category.banners[0]?.image,
                      "/brand/logo.jpeg",
                    )}
                    alt={visual?.alt ?? category.title}
                    fill
                    sizes="(min-width: 1280px) 379px, (min-width: 768px) 46vw, 100vw"
                    className="object-cover object-center"
                  />
                  <div className="atelier-collection-shade" />
                  <h3 className="atelier-collection-title">{category.title}</h3>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
export function CatalogProductCard({ product }: { product: ProductDto }) {
  const price = getVariantMinPrice(product);
  const compare = getCatalogCompareAtPrice(product);
  return (
    <article className="shop-product relative min-w-0">
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
      <div className="absolute right-3 top-3 z-10">
        <WishlistButton productId={product.id} compact />
      </div>
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
