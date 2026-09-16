// HTTP wire contracts mirrored from marihandmade-backend catalog/contracts.ts.
import { z } from "zod";

// Object schemas are explicit allowlists and strip unlisted database fields,
// including nested fields. They are also runtime-checked response contracts.
export const brandDto = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  logo: z.string().nullable(),
});
export const categoryDto = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
});
export const categoryListDto = categoryDto.extend({
  banners: z.array(z.object({ image: z.string() })),
});
const optionDto = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().int(),
});
const optionValueDto = z.object({
  id: z.string(),
  value: z.string(),
  position: z.number().int(),
});
const variantDto = z.object({
  id: z.string(),
  sku: z.string(),
  title: z.string().nullable(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  active: z.boolean(),
  leadTimeDays: z.number().int().nullable(),
});
export const productDto = z.object({
  id: z.string(),
  slug: z.string().nullable(),
  title: z.string(),
  shortDescription: z.string().nullable(),
  description: z.string().nullable(),
  images: z.array(z.string()),
  keywords: z.array(z.string()),
  price: z.number(),
  discount: z.number(),
  stock: z.number().int(),
  isPhysical: z.boolean(),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  kind: z.enum(["HANDMADE", "RESALE", "BUNDLE"]).nullable(),
  category: z
    .enum(["DOLL", "BAG", "COSTUME", "YARN", "ACCESSORY", "KIT"])
    .nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).nullable(),
  fulfillmentMode: z.enum(["READY", "MADE_TO_ORDER", "BOTH"]).nullable(),
  personalizationAllowed: z.boolean(),
  publishedAt: z
    .string().datetime()
    .nullable(),
  brand: brandDto,
  categories: z.array(categoryDto),
  productImages: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      altText: z.string().nullable(),
      position: z.number().int(),
      isCover: z.boolean(),
    }),
  ),
  options: z.array(optionDto.extend({ values: z.array(optionValueDto) })),
  variants: z.array(
    variantDto.extend({
      inventory: z
        .object({
          trackQuantity: z.boolean(),
          quantityOnHand: z.number().int(),
          quantityReserved: z.number().int(),
          allowBackorder: z.boolean(),
        })
        .nullable(),
      optionAssignments: z.array(
        z.object({ optionValue: optionValueDto.extend({ option: optionDto }) }),
      ),
      bundleComponents: z.array(
        z.object({
          id: z.string(),
          componentType: z.enum([
            "CATALOG_VARIANT",
            "CUSTOM_COMPONENT",
            "DIGITAL_COMPONENT",
          ]),
          name: z.string(),
          quantity: z.number().int(),
          unit: z.string().nullable(),
          sortOrder: z.number().int(),
          isOptional: z.boolean(),
          referencedVariant: variantDto.nullable(),
        }),
      ),
    }),
  ),
});

export type ProductDto = z.output<typeof productDto>;
export type CategoryDto = z.output<typeof categoryListDto>;
export type BrandDto = z.output<typeof brandDto>;

