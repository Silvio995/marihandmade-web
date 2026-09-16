import { getAvailabilityLabel } from "@/lib/inventory-availability";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductWithIncludes } from "@/types/product";
import {
  getPrimaryImageUrl,
  getVariantMinPrice,
  formatEuro,
} from "@/lib/product-display";
import Image from "next/image";
import Link from "next/link";

export const ProductGrid = ({
  products,
}: {
  products: ProductWithIncludes[];
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export const ProductSkeletonGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card
          key={index}
          className="overflow-hidden rounded-2xl border animate-pulse"
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
};

export const ProductCard = ({ product }: { product: ProductWithIncludes }) => {
  const primaryImage = getPrimaryImageUrl(product);

  const productHref = `/products/${encodeURIComponent(product.slug ?? product.id)}`;
  const categoryTitle = product.categories?.[0]?.title ?? "Collezione";
  const price = formatEuro(getVariantMinPrice(product));
  const title = product.title || "Prodotto";

  return (
    <Link
      href={productHref}
      aria-label={title}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
    >
      <Card className="h-full overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800/60 dark:bg-neutral-950">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          <Image
            src={primaryImage}
            alt={title}
            fill
            className="object-cover transition duration-700 group-hover:scale-105"
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          <div className="absolute left-3 top-3">
            <Badge className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-900 shadow-sm">
              {categoryTitle}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/45 px-3 py-2 text-white backdrop-blur">
            <span className="text-xs uppercase tracking-[0.18em] text-white/85">
              {categoryTitle}
            </span>
            <span className="text-sm font-semibold">{price}</span>
          </div>
        </div>

        <CardContent className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-6 text-neutral-900 dark:text-neutral-50">
            {title}
          </h3>
          {
            <p className="text-xs font-medium text-neutral-500">
              {getAvailabilityLabel(product)}
            </p>
          }
          {product.description && (
            <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {product.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
