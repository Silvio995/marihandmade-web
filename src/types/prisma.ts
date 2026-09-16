import type { ProductWithIncludes, ProductVariantType } from './product'
export type { ProductWithIncludes, ProductVariantType, BrandType, CategoryType } from './product'

export interface CartItemWithProduct {
   cartId?: string
   productId: string
   variantId?: string | null
   count: number
   product?: ProductWithIncludes | null
   variant?: ProductVariantType | null
}

export interface CartWithItems {
   id?: string
   userId?: string
   items: CartItemWithProduct[]
}

export type CartSummary = CartWithItems | null

export interface AddressType {
   id: string
   country?: string | null
   address: string
   city: string
   phone: string
   postalCode: string
}

export interface OrderItemWithProduct {
   product?: ProductWithIncludes | null
   variantId?: string | null
   variant?: ProductVariantType | null
   count: number
   price?: number
   discount?: number
}

export interface OrderWithIncludes {
   id: string
   number?: number
   status?: string
   createdAt?: string | Date
   shipping: number
   payable: number
   discount: number
   isPaid?: boolean
   isCompleted?: boolean
   address?: AddressType | null
   orderItems?: OrderItemWithProduct[]
   refund?: unknown
   payments?: Array<{
      provider?: {
         title?: string | null
      } | null
   }>
   user?: UserWithIncludes | null
}

export interface UserWithIncludes {
   id?: string
   email?: string | null
   phone?: string | null
   name?: string | null
   birthday?: string | null
   cart?: CartSummary
   wishlist?: ProductWithIncludes[]
   addresses?: AddressType[]
   isBanned?: boolean
   isEmailVerified?: boolean
   isPhoneVerified?: boolean
   isEmailSubscribed?: boolean
   isPhoneSubscribed?: boolean
}
