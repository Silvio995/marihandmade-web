"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/native/ProductGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ProductDto as ProductWithIncludes } from "@/lib/api/contracts";
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

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc";

interface CategoryCollectionProps {
  category: {
    title: string;
    description?: string;
    heroImage: string;
  };
  products: ProductWithIncludes[];
  variant?: "editorial" | "retail";
}

export default function CategoryCollection({
  category,
  products,
  variant = "editorial",
}: CategoryCollectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [onlyReady, setOnlyReady] = useState(false);
  const isCatalog = category.title.toLowerCase() === "catalogo";
  const isRetail = variant === "retail";

  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortKey) {
      case "price-asc":
        return list.sort(
          (a, b) =>
            Number(getVariantMinPrice(a)) - Number(getVariantMinPrice(b)),
        );
      case "price-desc":
        return list.sort(
          (a, b) =>
            Number(getVariantMinPrice(b)) - Number(getVariantMinPrice(a)),
        );
      case "name-asc":
        return list.sort((a, b) =>
          (a.title || "").localeCompare(b.title || ""),
        );
      case "default":
      default:
        return list;
    }
  }, [products, sortKey]);

  const filteredProducts = useMemo(() => {
    if (!onlyReady) return sortedProducts;
    return sortedProducts.filter(
      (product) => getProductDisplayAvailability(product, 1).isPurchasable,
    );
  }, [onlyReady, sortedProducts]);

  return (
    <div className={isRetail ? "bg-[#f6f6f6]" : "bg-[#f8f6f2]"}>
      <section className="w-full">
        <div
          className={`relative w-full overflow-hidden ${
            isRetail
              ? "border-b border-neutral-200 bg-white"
              : "rounded-b-[36px] border-b border-[#e6ddd1] bg-[#ece5da]"
          }`}
        >
          <div
            className={`relative h-[220px] w-full sm:h-[300px] md:h-[360px] ${isRetail ? "" : "rounded-b-[36px]"}`}
          >
            <Image
              src={category.heroImage}
              alt={category.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            {isRetail ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/0 to-white/0" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/10 to-transparent" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f1a17]/80 via-[#1f1a17]/28 to-transparent" />
                <div className="absolute inset-0 opacity-[0.18] mix-blend-soft-light [background:radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_60%),repeating-linear-gradient(90deg,_rgba(255,255,255,0.06)_0px,_rgba(255,255,255,0.06)_1px,_transparent_1px,_transparent_6px)]" />
              </>
            )}
          </div>
        </div>
      </section>

      <section
        className={
          isRetail
            ? "mx-auto max-w-6xl px-6 py-10 md:py-12"
            : "container py-12 md:py-14"
        }
      >
        <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p
              className={`${isRetail ? "text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500" : "text-sm uppercase tracking-[0.25em] text-[#8f7f70]"}`}
            >
              {isCatalog ? "Catalogo" : isRetail ? "Categoria" : "Categoria"}
            </p>
            <h1
              className={`${isRetail ? "mt-2 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl" : "mt-2 font-serif text-3xl font-semibold leading-tight text-[#1f1a17]"}`}
            >
              {category.title}
            </h1>
            {isRetail && category.description && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
                {category.description}
              </p>
            )}
          </div>

          <div
            className={
              isRetail
                ? "flex flex-wrap items-center gap-3"
                : "flex flex-wrap items-center gap-3"
            }
          >
            {isRetail && (
              <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "prodotto" : "prodotti"}
              </div>
            )}

            <div
              className={
                isRetail
                  ? "flex flex-wrap items-center gap-3 rounded-[12px] border border-neutral-200 bg-white p-3"
                  : ""
              }
            >
              <Button
                variant={onlyReady ? "default" : "outline"}
                className={
                  isRetail
                    ? "h-10 rounded-full border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm hover:bg-neutral-50"
                    : "rounded-full"
                }
                onClick={() => setOnlyReady((v) => !v)}
              >
                {onlyReady ? "Mostra tutto" : "Solo disponibili"}
              </Button>
              <div className="flex items-center gap-2">
                <span
                  className={
                    isRetail
                      ? "text-sm text-neutral-600"
                      : "text-sm text-[#63574d]"
                  }
                >
                  Ordina
                </span>
                <Select
                  value={sortKey}
                  onValueChange={(value) => setSortKey(value as SortKey)}
                >
                  <SelectTrigger
                    className={
                      isRetail
                        ? "h-10 w-48 rounded-full border-neutral-200 bg-white text-sm shadow-sm"
                        : "w-48 rounded-full"
                    }
                  >
                    <SelectValue placeholder="Ordine del catalogo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Ordine del catalogo</SelectItem>
                    <SelectItem value="price-asc">Prezzo crescente</SelectItem>
                    <SelectItem value="price-desc">
                      Prezzo decrescente
                    </SelectItem>
                    <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          isRetail ? (
            <RetailProductGrid products={filteredProducts} />
          ) : (
            <ProductGrid products={filteredProducts} />
          )
        ) : (
          <div
            className={
              isRetail
                ? "rounded-[14px] border border-dashed border-neutral-300 bg-white px-6 py-14 text-center shadow-sm md:py-16"
                : "rounded-[28px] border border-dashed border-[#dfd2c0] bg-white px-6 py-16 text-center shadow-[0_14px_40px_rgba(32,22,16,0.06)]"
            }
          >
            <p
              className={
                isRetail
                  ? "text-lg font-semibold text-neutral-900"
                  : "font-serif text-2xl font-semibold text-[#2f2520]"
              }
            >
              Nessun prodotto disponibile.
            </p>
            <p
              className={
                isRetail
                  ? "mt-2 text-sm text-neutral-600"
                  : "mt-2 text-sm text-[#6a5d53]"
              }
            >
              Vuoi una proposta su misura? Scrivici su WhatsApp.
            </p>
            <Button
              asChild
              className={
                isRetail
                  ? "mt-6 rounded-full bg-neutral-900 px-6 hover:bg-neutral-800"
                  : "mt-6 rounded-full bg-[#1f1a17] px-6 hover:bg-[#3a2f2a]"
              }
            >
              <Link href="/contact">Contattami su WhatsApp</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function RetailProductGrid({ products }: { products: ProductWithIncludes[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {products.map((product) => (
        <RetailProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function RetailProductCard({ product }: { product: ProductWithIncludes }) {
  const title = product.title || "Prodotto";
  const href = `/products/${encodeURIComponent(product.slug ?? product.id)}`;
  const primaryImage = getPrimaryImageUrl(product);
  const lowestPrice = getVariantMinPrice(product);
  const compareAtPrice = getCatalogCompareAtPrice(product);

  const availability = getProductDisplayAvailability(product, 1);
  const isPurchasable = availability.isPurchasable;
  const price = formatEuro(lowestPrice);

  return (
    <Link
      href={href}
      aria-label={title}
      className="group block rounded-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f6]"
    >
      <div className="overflow-hidden rounded-[12px] border border-neutral-200 bg-white shadow-sm transition-colors duration-200 hover:border-neutral-300">
        <div className="relative aspect-[4/3] w-full bg-white">
          <Image
            src={primaryImage}
            alt={title}
            fill
            className="object-contain p-6 transition duration-200 group-hover:scale-[1.01]"
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 26vw, (min-width: 640px) 48vw, 100vw"
          />
          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-700">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isPurchasable ? "bg-emerald-500" : "bg-neutral-300"}`}
            />
            <span>{getAvailabilityLabel(product)}</span>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-neutral-200 px-4 pb-5 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {product.categories?.map((category) => category.title).join(" · ")}
          </p>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-5 text-neutral-900">
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-semibold text-neutral-900">{price}</p>
            {compareAtPrice != null && (
              <p className="text-xs text-neutral-500 line-through">
                {formatEuro(compareAtPrice)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
