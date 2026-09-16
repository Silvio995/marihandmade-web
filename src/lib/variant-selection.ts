import type { ProductVariantType, ProductWithIncludes } from '@/types/product'
import { isVariantPurchasable } from './inventory-availability'

export type VariantSelection = Record<string, string>

export function buildVariantOptionMap(
   variant: ProductVariantType
): VariantSelection {
   const map: VariantSelection = {}
   variant.optionAssignments?.forEach((assignment) => {
      const optionId = assignment.optionValue?.option?.id
      const valueId = assignment.optionValue?.id
      if (optionId && valueId) map[optionId] = valueId
   })
   return map
}

export function selectionMatchesVariant(
   variant: ProductVariantType,
   selection: VariantSelection
) {
   const map = buildVariantOptionMap(variant)
   const mapKeys = Object.keys(map)
   const selectionKeys = Object.keys(selection)

   if (mapKeys.length === 0) return selectionKeys.length === 0

   const everyOptionMatches =
      mapKeys.every((key) => selection[key] === map[key]) &&
      selectionKeys.every((key) => map[key] === selection[key])

   return everyOptionMatches
}

export function findActiveVariant(
   variants: ProductWithIncludes['variants'] | undefined,
   selection: VariantSelection
) {
   if (!variants?.length) return null
   return variants.find((variant) => selectionMatchesVariant(variant, selection)) ?? null
}

export function pickInitialVariant(
   variants: ProductWithIncludes['variants'] | undefined
) {
   if (!variants?.length) return null
   const inStock = variants.find((variant) => isVariantPurchasable(variant, 1))
   const active = variants.find((variant) => variant.active)
   return inStock ?? active ?? variants[0] ?? null
}
