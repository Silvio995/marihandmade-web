import { Card, CardContent } from "@/components/ui/card";
import type { ProductWithIncludes } from "@/types/product";
import {
  getPrimaryImageUrl,
  getVariantMinPrice,
  getCatalogCompareAtPrice,
  formatEuro,
} from "@/lib/product-display";
import {
  getProductDisplayAvailability,
  getAvailabilityLabel,
} from "@/lib/inventory-availability";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function ProductGrid({ products }: { products: ProductWithIncludes[] }) {
  return (
    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800"
        >
          <div className="aspect-[4/5] w-full bg-neutral-200 dark:bg-neutral-800" />
          <CardContent className="space-y-3 p-4">
            <div className="h-5 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-5 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProductCard({ product }: { product: ProductWithIncludes }) {
  const primaryImage = getPrimaryImageUrl(product);
  const categoryTitle = product.categories?.[0]?.title ?? "Collezione";
  const productHref = `/products/${encodeURIComponent(product.slug ?? product.id)}`;
  const lowestPrice = getVariantMinPrice(product);
  const compareAtPrice = getCatalogCompareAtPrice(product);
  const price = formatEuro(lowestPrice);
  const availability = getProductDisplayAvailability(product, 1);
  const title = product.title || "Prodotto";
  const isPurchasable = availability.isPurchasable;
  const shortDescription = product.shortDescription ?? product.description;

  return (
    <Link
      href={productHref}
      aria-label={title}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f2520]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f6f2]"
    >
      <Card className="h-full overflow-hidden rounded-[28px] border border-[#e9dfd2] bg-white shadow-[0_14px_40px_rgba(32,22,16,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(32,22,16,0.14)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-[#fbf9f4] to-[#f1ece2]">
          <Image
            src={primaryImage}
            alt={title}
            fill
            className="object-cover transition duration-700 group-hover:scale-[1.06]"
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1f1a17]/65 via-[#1f1a17]/15 to-transparent opacity-90" />

          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
            <div className="inline-flex max-w-[70%] rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#5d4d41] shadow-sm backdrop-blur">
              <span className="truncate">{categoryTitle}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Badge
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm ${
                  isPurchasable
                    ? "bg-[#1f1a17] text-white"
                    : "bg-[#8b7664] text-white"
                }`}
              >
                {getAvailabilityLabel(product)}
              </Badge>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/80">
                {categoryTitle}
              </p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-6 text-white">
                  {title}
                </h3>
                <div className="text-right">
                  <p className="whitespace-nowrap text-sm font-semibold text-white">
                    {price}
                  </p>
                  {compareAtPrice != null && (
                    <p className="whitespace-nowrap text-xs text-white/70 line-through">
                      {formatEuro(compareAtPrice)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <p className="font-medium text-white/80">
                  {getAvailabilityLabel(product)}
                </p>
                <span className="text-white/70 transition group-hover:text-white">
                  Scopri
                </span>
              </div>
            </div>
          </div>
        </div>

        {shortDescription && (
          <CardContent className="px-5 pb-6 pt-4">
            <p className="line-clamp-2 text-sm leading-relaxed text-[#5b4f45]">
              {shortDescription}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
