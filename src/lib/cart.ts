import type { CartItemWithProduct, CartSummary } from '@/types/prisma'

export function writeLocalCart(cart: CartSummary | null) {
   if (typeof window === 'undefined' || !window.localStorage) return

   window.localStorage.setItem('Cart', JSON.stringify(cart))
}

export function getLocalCart(): CartSummary | null {
   if (typeof window === 'undefined' || !window.localStorage) {
      return null
   }

   try {
      const raw = window.localStorage.getItem('Cart')
      if (!raw) return null
      const cart = JSON.parse(raw) as CartSummary | null
      // Older Web versions wrote account carts here. Never re-merge those as guest data.
      if (cart?.userId) { writeLocalCart(null); return null }
      return cart
   } catch (error) {
      writeLocalCart({ items: [] })
      return { items: [] }
   }
}

export function getCountInCart({
   cartItems,
   productId,
   variantId,
}: {
   cartItems?: CartItemWithProduct[] | null
   productId: string
   variantId?: string | null
}) {
   if (!cartItems) return 0

   if (variantId) {
      const variantMatch = cartItems.find(
         (item) => item?.productId === productId && item?.variantId === variantId
      )
      return variantMatch?.count ?? 0
   }

   const productMatch = cartItems.find(
      (item) => item?.productId === productId && !item?.variantId
   )
   if (productMatch?.count != null) return productMatch.count

   return 0
}

export function findCartItemIndex({
   cartItems,
   productId,
   variantId,
}: {
   cartItems: CartItemWithProduct[]
   productId: string
   variantId?: string | null
}) {
   return cartItems.findIndex(
      (item) =>
         item?.productId === productId &&
         ((variantId && item?.variantId === variantId) ||
            (!variantId && !item?.variantId))
   )
}
