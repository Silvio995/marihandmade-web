import type { ProductVariantType, ProductWithIncludes } from "@/types/product";

type InventoryLike = {
  quantityOnHand?: number | null;
  quantityReserved?: number | null;
  trackQuantity?: boolean | null;
  allowBackorder?: boolean | null;
};

type VariantLike = {
  active?: boolean | null;
  inventory?: InventoryLike | null;
};

export function getVariantAvailableQuantity(
  variant?: VariantLike | null,
): number | null {
  if (!variant?.inventory) return null;
  const quantityOnHand = Number(variant.inventory.quantityOnHand ?? 0);
  const quantityReserved = Number(variant.inventory.quantityReserved ?? 0);
  return quantityOnHand - quantityReserved;
}

export function isVariantPurchasable(
  variant?: VariantLike | null,
  requestedQty = 1,
): boolean {
  if (!variant || variant.active === false) return false;
  const inventory = variant.inventory;
  if (!inventory) return false;

  if (inventory.trackQuantity === false) return true;
  if (inventory.allowBackorder === true) return true;

  const available = getVariantAvailableQuantity(variant);
  return (available ?? 0) >= requestedQty;
}

export function getFirstPurchasableVariant(
  product: ProductWithIncludes | undefined | null,
  requestedQty = 1,
): ProductVariantType | undefined {
  if (!product?.variants?.length) return undefined;
  return product.variants.find((variant) =>
    isVariantPurchasable(variant, requestedQty),
  );
}

export function isLegacyProductPurchasable(
  product:
    | Pick<ProductWithIncludes, "isAvailable" | "stock">
    | undefined
    | null,
  requestedQty = 1,
): boolean {
  if (!product) return false;
  return Boolean(product.isAvailable) && (product.stock ?? 0) >= requestedQty;
}

export function getProductDisplayAvailability(
  product: ProductWithIncludes | undefined | null,
  requestedQty = 1,
) {
  if (!product) {
    return {
      hasVariants: false,
      isPurchasable: false,
      source: "legacy" as const,
      availableQuantity: null as number | null,
      variant: undefined as ProductVariantType | undefined,
    };
  }

  const hasVariants = (product.variants?.length ?? 0) > 0;
  if (hasVariants) {
    const variant = getFirstPurchasableVariant(product, requestedQty);
    return {
      hasVariants: true,
      isPurchasable: Boolean(variant),
      source: "variant" as const,
      availableQuantity: variant ? getVariantAvailableQuantity(variant) : null,
      variant,
    };
  }

  return {
    hasVariants: false,
    isPurchasable: isLegacyProductPurchasable(product, requestedQty),
    source: "legacy" as const,
    availableQuantity: product.stock ?? null,
    variant: undefined as ProductVariantType | undefined,
  };
}

/** Display only: does not change purchase eligibility or infer preparation promises. */
export function getAvailabilityLabel(
  product: ProductWithIncludes,
  variant?: ProductVariantType | null,
) {
  const hasVariants = Boolean(product.variants?.length);
  const selected =
    variant === undefined ? getFirstPurchasableVariant(product) : variant;
  const purchasable = hasVariants
    ? isVariantPurchasable(selected)
    : isLegacyProductPurchasable(product);
  if (!purchasable) return "Esaurito";
  if (
    product.fulfillmentMode === "MADE_TO_ORDER" ||
    (selected?.inventory?.allowBackorder &&
      (getVariantAvailableQuantity(selected) ?? 0) <= 0)
  ) {
    return "Su ordinazione";
  }
  return "Disponibile";
}
