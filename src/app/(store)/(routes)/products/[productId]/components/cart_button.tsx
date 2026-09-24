'use client'

import { Button } from '@/components/ui/button'
import { useAuthenticated } from '@/hooks/useAuthentication'
import { getCountInCart, getLocalCart } from '@/lib/cart'
import { useCartContext } from '@/state/Cart'
import { MinusIcon, PlusIcon, ShoppingBasketIcon, X } from 'lucide-react'
import { Spinner } from '@/components/native/icons'
import type { CartSummary } from '@/types/prisma'
import type { ProductWithIncludes } from '@/types/product'
import { useState } from 'react'

export default function CartButton({
   product,
   selectedVariantId,
   disabled,
   variantPurchasable,
}: {
   product: ProductWithIncludes
   selectedVariantId?: string | null
   disabled?: boolean
   variantPurchasable?: boolean
}) {
   return (
      <>
         <ButtonComponent
            product={product}
            selectedVariantId={selectedVariantId}
            disabled={disabled}
            variantPurchasable={variantPurchasable}
         />
      </>
   )
}

function ButtonComponent({
   product,
   selectedVariantId,
   disabled,
   variantPurchasable = true,
}: {
   product: ProductWithIncludes
   selectedVariantId?: string | null
   disabled?: boolean
   variantPurchasable?: boolean
}) {
   const { authenticated, loading: authLoading, error: authError } = useAuthenticated()
   const { cart, dispatchCart } = useCartContext()
   const [fetchingCart, setFetchingCart] = useState(false)
   const hasVariantStructure =
      (product.options?.some((opt) => (opt.values?.length ?? 0) > 0) ?? false) ||
      ((product.variants?.length ?? 0) > 0)

   const count = getCountInCart({
      cartItems: cart?.items,
      productId: product.id,
      variantId: selectedVariantId,
   })

   const targetVariantId = selectedVariantId ?? null
   const requiresValidVariant = hasVariantStructure
   const effectiveDisabled =
      authLoading || authError || disabled ||
      (requiresValidVariant && !targetVariantId) ||
      (requiresValidVariant && !variantPurchasable)

   async function onAddToCart() {
      if (effectiveDisabled || (requiresValidVariant && !targetVariantId)) return
      setFetchingCart(true)
      try {
         if (authenticated) {
            const res = await fetch('/api/cart', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  productId: product.id,
                  variantId: targetVariantId,
                  count: 1,
                  merge: true,
               }),
            })
            const json: CartSummary = await res.json()
            await dispatchCart(json)
         } else {
            const localCart: CartSummary = getLocalCart() ?? { items: [] }
            const index = localCart.items.findIndex(
               (i) =>
                  i.productId === product.id &&
                  (targetVariantId ? i.variantId === targetVariantId : !i.variantId)
            )
            if (index >= 0) localCart.items[index].count += 1
            else
               localCart.items.push({
                  productId: product.id,
                  product,
                  variantId: targetVariantId ?? undefined,
                  count: 1,
               })
            await dispatchCart(localCart)
         }
      } catch (err) {
         console.error(err)
      }
      setFetchingCart(false)
   }

   async function onRemoveFromCart() {
      if (effectiveDisabled || (requiresValidVariant && !targetVariantId)) return
      setFetchingCart(true)
      try {
         if (authenticated) {
            const res = await fetch('/api/cart', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  productId: product.id,
                  variantId: targetVariantId,
                  count: count - 1,
               }),
            })
            const json: CartSummary = await res.json()
            await dispatchCart(json)
         } else {
            const localCart: CartSummary = getLocalCart() ?? { items: [] }
            const index = localCart.items.findIndex(
               (i) =>
                  i.productId === product.id &&
                  (targetVariantId ? i.variantId === targetVariantId : !i.variantId)
            )
            if (index >= 0) {
               if (localCart.items[index].count > 1)
                  localCart.items[index].count -= 1
               else localCart.items.splice(index, 1)
            }
            await dispatchCart(localCart)
         }
      } catch (err) {
         console.error(err)
      }
      setFetchingCart(false)
   }

   if (fetchingCart)
      return (
         <Button disabled>
            <Spinner />
         </Button>
      )

   if (count === 0) {
      return (
         <Button
            onClick={onAddToCart}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            disabled={effectiveDisabled}
            title={
               effectiveDisabled
                  ? 'Variante non acquistabile'
                  : undefined
            }
         >
            <ShoppingBasketIcon className="h-4" /> Aggiungi al carrello
         </Button>
      )
   }

   return (
      <div className="flex gap-2">
         <Button
            variant="outline"
            size="icon"
            onClick={onRemoveFromCart}
            disabled={effectiveDisabled}
            className="h-12 w-12 rounded-full border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50"
         >
            {count === 1 ? <X className="h-4 w-4" /> : <MinusIcon className="h-4 w-4" />}
         </Button>
         <Button
            disabled
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-neutral-200 bg-white font-semibold text-neutral-900"
         >
            {count}
         </Button>
         <Button
            variant="outline"
            size="icon"
            onClick={onAddToCart}
            disabled={effectiveDisabled}
            className="h-12 w-12 rounded-full border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50"
         >
            <PlusIcon className="h-4 w-4" />
         </Button>
      </div>
   )
}
