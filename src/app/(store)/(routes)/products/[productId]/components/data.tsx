"use client";

import type { ProductWithIncludes } from "@/types/product";
import { getVariantMinPrice, formatEuro } from "@/lib/product-display";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import {
  getAvailabilityLabel,
  isLegacyProductPurchasable,
  isVariantPurchasable,
} from "@/lib/inventory-availability";
import {
  buildVariantOptionMap,
  findActiveVariant,
  pickInitialVariant,
  selectionMatchesVariant,
} from "@/lib/variant-selection";

import CartButton from "./cart_button";

const EMPTY_VARIANTS: NonNullable<ProductWithIncludes["variants"]> = [];
const EMPTY_OPTIONS: NonNullable<ProductWithIncludes["options"]> = [];

export function DataSection({ product }: { product: ProductWithIncludes }) {
  const categories = product.categories ?? [];
  const options = (product.options ?? EMPTY_OPTIONS).filter(
    (option) => option.values?.length,
  );
  const variants = product.variants ?? EMPTY_VARIANTS;
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => pickInitialVariant(variants)?.id ?? "",
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const defaults: Record<string, string> = {};
    const preferredVariant = pickInitialVariant(variants) ?? variants[0];
    const optionMap = preferredVariant
      ? buildVariantOptionMap(preferredVariant)
      : {};
    Object.assign(defaults, optionMap);

    options.forEach((opt) => {
      const firstValue = opt.values?.[0];
      if (opt.id && firstValue && !defaults[opt.id]) {
        defaults[opt.id] = firstValue.id;
      }
    });

    return defaults;
  });

  const activeVariant = useMemo(() => {
    if (!variants.length) return null;
    if (!options.length)
      return (
        variants.find((variant) => variant.id === selectedVariantId) ?? null
      );
    return findActiveVariant(variants, selectedOptions);
  }, [selectedOptions, variants, options.length, selectedVariantId]);
  const bundleComponents = activeVariant?.bundleComponents ?? [];

  const isValueCompatible = useMemo(() => {
    if (!variants.length) return () => true;
    return (optionId: string, valueId: string) => {
      const nextSelection = { ...selectedOptions, [optionId]: valueId };
      return variants.some((variant) =>
        selectionMatchesVariant(variant, nextSelection),
      );
    };
  }, [selectedOptions, variants]);

  const priceValue = activeVariant?.price ?? getVariantMinPrice(product);
  const compareAtValue =
    activeVariant?.compareAtPrice != null &&
    activeVariant.compareAtPrice > priceValue
      ? activeVariant.compareAtPrice
      : null;
  const price = formatEuro(priceValue);
  const hasVariants = variants.length > 0;
  const activeVariantPurchasable = hasVariants
    ? isVariantPurchasable(activeVariant, 1)
    : isLegacyProductPurchasable(product, 1);
  const stockLabel = getAvailabilityLabel(product, activeVariant);
  const activeVariantLabel = activeVariant?.title || null;
  const shortDescription = product.shortDescription ?? product.description;
  const badgeLabel = stockLabel;

  const categoryLabel =
    categories.length > 0
      ? categories.map((cat) => cat.title).join(" · ")
      : null;

  return (
    <div className="flex flex-col gap-5 rounded-[12px] border border-neutral-200 bg-white p-6 shadow-sm md:p-7">
      <div className="space-y-4 border-b border-neutral-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabel && (
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700">
                {categoryLabel}
              </span>
            )}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-700">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                activeVariantPurchasable ? "bg-emerald-500" : "bg-neutral-300"
              }`}
            />
            <span>{badgeLabel}</span>
          </div>
        </div>

        <h1 className="text-[30px] font-semibold leading-[1.06] tracking-tight text-neutral-900 md:text-[36px]">
          {product.title}
        </h1>

        <div className="flex flex-wrap items-baseline gap-3">
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
            {price}
          </p>
          {compareAtValue != null && (
            <p className="text-sm text-neutral-500 line-through">
              {formatEuro(compareAtValue)}
            </p>
          )}
          {stockLabel && (
            <p className="text-sm font-medium text-neutral-600">{stockLabel}</p>
          )}
        </div>

        {shortDescription && (
          <p className="text-[15px] leading-relaxed text-neutral-700">
            {shortDescription}
          </p>
        )}
      </div>

      {variants.length > 0 && options.length === 0 && (
        <div className="space-y-2">
          <label htmlFor="product-variant" className="text-sm font-semibold">
            Variante
          </label>
          <select
            id="product-variant"
            className="w-full rounded-md border border-neutral-200 bg-white p-3 text-sm"
            value={selectedVariantId}
            onChange={(event) => setSelectedVariantId(event.target.value)}
          >
            {variants.map((variant, index) => (
              <option key={variant.id} value={variant.id}>
                {variant.title || `Variante ${index + 1}`} —{" "}
                {formatEuro(variant.price)}
              </option>
            ))}
          </select>
        </div>
      )}

      {options.length > 0 && (
        <div className="space-y-4 rounded-[12px] border border-neutral-200 bg-white p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900">
              Scegli la variante
            </p>
          </div>
          {options.map((opt) => (
            <div key={opt.id} className="space-y-2">
              <p className="text-sm font-semibold text-neutral-800">
                {opt.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {opt.values?.map((val) => {
                  const isActive = selectedOptions[opt.id] === val.id;
                  const compatible = isValueCompatible(opt.id, val.id);
                  return (
                    <Button
                      key={val.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      type="button"
                      disabled={!compatible}
                      className={`h-9 rounded-md border-neutral-200 px-4 text-sm font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                        isActive
                          ? "bg-neutral-900 text-white hover:bg-neutral-800"
                          : "bg-white text-neutral-900 hover:bg-neutral-50"
                      } ${!compatible ? "opacity-40" : ""}`}
                      onClick={() => {
                        if (!compatible) return;
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [opt.id]: val.id,
                        }));
                      }}
                    >
                      {val.value}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="rounded-[10px] border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            {activeVariant ? (
              <span>
                Selezione:{" "}
                <span className="font-semibold">
                  {activeVariantLabel ?? "Disponibile"}
                </span>
                <span className="text-neutral-500"> · {stockLabel}</span>
              </span>
            ) : (
              <span className="text-neutral-500">
                Seleziona una combinazione per vedere disponibilita’ e prezzo.
              </span>
            )}
          </div>
        </div>
      )}

      {bundleComponents.length > 0 && (
        <div className="space-y-2 rounded-[12px] border border-neutral-200 p-4">
          <p className="text-sm font-semibold text-neutral-900">
            Componenti kit/bundle
          </p>
          <ul className="space-y-1 text-sm text-neutral-700">
            {bundleComponents.map((bc) => (
              <li key={bc.id} className="flex justify-between gap-3">
                <span className="font-medium text-neutral-900">
                  {bc.name} ×{bc.quantity}
                  {bc.unit ? ` ${bc.unit}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-[12px] border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap gap-2 text-xs font-medium text-neutral-600">
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2">
            {stockLabel}
          </span>
          {product.personalizationAllowed && (
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2">
              Personalizzabile
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <CartButton
            product={product}
            selectedVariantId={activeVariant?.id}
            disabled={
              options.length > 0
                ? !activeVariant || !activeVariantPurchasable
                : !activeVariantPurchasable
            }
            variantPurchasable={activeVariantPurchasable}
          />
        </div>
        <p className="text-xs leading-relaxed text-neutral-600">
          Pagamento sicuro. Per personalizzazioni, scrivici su WhatsApp.
        </p>
      </div>
    </div>
  );
}
