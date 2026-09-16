// Shared presentation shape: accepts catalog DTOs and transitional cart/order products. No generated database types.
export interface BrandType {
   id: string
   title: string
   description?: string | null
   logo?: string | null
}

export interface CategoryType {
   id: string
   title: string
   slug: string
   description?: string | null
}

export interface ProductWithIncludes {
   id: string
   slug?: string | null
   title: string
   shortDescription?: string | null
   description: string | null
   images: string[]
   keywords?: string[]
   metadata?: unknown
   price: number
   discount: number
   stock?: number
   isPhysical?: boolean
   isAvailable?: boolean
   isFeatured?: boolean
   status?: string | null
   fulfillmentMode?: string | null
   personalizationAllowed?: boolean | null
   publishedAt?: string | Date | null
   category?: string | null
   brand?: BrandType | null
   categories?: CategoryType[]
   productImages?: Array<{
      id: string
      url: string
      altText?: string | null
      position: number
      isCover: boolean
   }>
   variants?: ProductVariantType[]
   options?: Array<{
      id: string
      name: string
      values?: Array<{
         id: string
         value: string
      }>
   }>
}

export interface ProductVariantType {
   id: string
   sku: string
   title?: string | null
   price: number
   compareAtPrice?: number | null
   active?: boolean
   leadTimeDays?: number | null
   inventory?: {
      quantityOnHand?: number | null
      quantityReserved?: number | null
      trackQuantity?: boolean | null
      allowBackorder?: boolean | null
   } | null
   optionAssignments?: Array<{
      optionValue?: {
         value?: string | null
         id?: string
         option?: { id?: string; name?: string | null } | null
      } | null
   }>
   bundleComponents?: Array<{
      id: string
      name: string
      quantity: number
      unit?: string | null
      sortOrder: number
      referencedVariant?: {
         id: string
         sku: string
      } | null
   }>
}

