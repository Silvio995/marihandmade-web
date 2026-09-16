import type { ProductWithIncludes } from "@/types/product";
import { getFirstPurchasableVariant } from "./inventory-availability";
import { getSafeImageSrc, isSafeImageSrc } from "./safe-image";

export const PRODUCT_IMAGE_PLACEHOLDER = "/images/product-placeholder.svg";

/** Catalog galleries are authoritative; legacy images are used only if none are usable. */
export function getProductGallery(
  product: ProductWithIncludes | undefined | null,
) {
  const title = product?.title || "Prodotto";
  const images = [...(product?.productImages ?? [])]
    .sort(
      (a, b) =>
        Number(b.isCover) - Number(a.isCover) || a.position - b.position,
    )
    .filter((image) => isSafeImageSrc(image.url))
    .map((image, index) => ({
      url: image.url,
      alt: image.altText || `${title} - immagine ${index + 1}`,
    }));
  if (images.length) return images;
  const legacy = (product?.images ?? [])
    .filter(isSafeImageSrc)
    .map((url, index) => ({ url, alt: `${title} - immagine ${index + 1}` }));
  return legacy.length
    ? legacy
    : [
        {
          url: PRODUCT_IMAGE_PLACEHOLDER,
          alt: `${title} - immagine non disponibile`,
        },
      ];
}

export function getPrimaryImageUrl(
  product: ProductWithIncludes | undefined | null,
  fallback = PRODUCT_IMAGE_PLACEHOLDER,
): string {
  const image = getProductGallery(product)[0].url;
  return image === PRODUCT_IMAGE_PLACEHOLDER
    ? getSafeImageSrc(fallback, PRODUCT_IMAGE_PLACEHOLDER)
    : image;
}

export function formatEuro(price: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

/** Compare-at must refer to the variant supplying the displayed minimum price. */
export function getCatalogCompareAtPrice(product: ProductWithIncludes) {
  const price = getVariantMinPrice(product);
  const compare = product.variants?.find(
    (variant) => variant.price === price,
  )?.compareAtPrice;
  return compare != null && compare > price ? compare : null;
}

/**
 * Returns the lowest available variant price, falling back to legacy product.price when no variant prices are present.
 */
export function getVariantMinPrice(
  product: ProductWithIncludes | undefined | null,
) {
  if (!product) return 0;
  const variantPrices =
    product.variants
      ?.map((v) => (typeof v.price === "number" ? v.price : null))
      .filter((v): v is number => v != null) ?? [];
  if (variantPrices.length === 0) return product.price ?? 0;
  return Math.min(...variantPrices);
}

/**
 * Returns the first variant that can actually be purchased.
 * Falls back to the first active variant, then to the first variant.
 */
export function getVariantWithStock(
  product: ProductWithIncludes | undefined | null,
) {
  if (!product) return undefined;
  return (
    getFirstPurchasableVariant(product) ??
    product.variants?.find((v) => v.active) ??
    product.variants?.[0]
  );
}
