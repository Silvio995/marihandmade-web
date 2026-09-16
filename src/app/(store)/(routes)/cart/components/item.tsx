'use client'

import { Spinner } from '@/components/native/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuthenticated } from '@/hooks/useAuthentication'
import { findCartItemIndex, getCountInCart, getLocalCart } from '@/lib/cart'
import { useCartContext } from '@/state/Cart'
import { buildVariantOptionMap } from '@/lib/variant-selection'
import type {
   CartItemWithProduct,
   CartWithItems,
   ProductWithIncludes,
} from '@/types/prisma'
import { MinusIcon, PlusIcon, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { getPrimaryImageUrl, getVariantMinPrice, getVariantWithStock } from '@/lib/product-display'

type ItemProps = {
   cartItem: CartItemWithProduct
}

export const Item = ({ cartItem }: ItemProps) => {
   const { authenticated } = useAuthenticated()
   const { cart, dispatchCart } = useCartContext()
   const [fetchingCart, setFetchingCart] = useState(false)

   const { product } = cartItem
   const productId = cartItem.productId ?? ''
   const variantId = cartItem.variantId ?? undefined
   const variant =
      variantId && product?.variants ? product.variants.find((v) => v.id === variantId) : null
   const variantIssues: string[] = []
   if (variantId && !variant) variantIssues.push('Variante non trovata')
   if (variant && variant.active === false) variantIssues.push('Variante non attiva')
   if (variant && variant.inventory?.quantityOnHand !== undefined) {
      if ((variant.inventory?.quantityOnHand ?? 0) <= 0) {
         variantIssues.push('Non disponibile')
      }
   }

   async function getProduct(): Promise<ProductWithIncludes | undefined> {
      try {
         const response = await fetch(`/api/products/${productId}`, {
            method: 'GET',
            cache: 'no-store',
         })

         return await response.json()
      } catch (error) {
         console.error({ error })
      }
   }

   async function onAddToCart() {
      try {
         setFetchingCart(true)

         if (authenticated) {
            const response = await fetch(`/api/cart`, {
               method: 'POST',
               body: JSON.stringify({
                  productId,
                  variantId,
                  count:
                     getCountInCart({ cartItems: cart?.items, productId, variantId }) + 1,
               }),
               cache: 'no-store',
               headers: {
                  'Content-Type': 'application/json-string',
               },
            })

            const json = await response.json()
            await dispatchCart(json)
         } else {
            const localCart: CartWithItems = getLocalCart() ?? { items: [] }
            const existingIndex = findCartItemIndex({
               cartItems: localCart.items,
               productId,
               variantId,
            })

            if (existingIndex >= 0) {
               localCart.items[existingIndex].count =
                  (localCart.items[existingIndex].count ?? 0) + 1
            } else {
               localCart.items.push({
                  productId,
                  product: await getProduct(),
                  variantId,
                  count: 1,
               })
            }

            await dispatchCart(localCart)
         }

         setFetchingCart(false)
      } catch (error) {
         console.error({ error })
         setFetchingCart(false)
      }
   }

   async function onRemoveFromCart() {
      try {
         setFetchingCart(true)

         if (authenticated) {
            const response = await fetch(`/api/cart`, {
               method: 'POST',
               body: JSON.stringify({
                  productId,
                  variantId,
                  count:
                     getCountInCart({ cartItems: cart?.items, productId, variantId }) - 1,
               }),
               cache: 'no-store',
               headers: {
                  'Content-Type': 'application/json-string',
               },
            })

            const json = await response.json()
            await dispatchCart(json)
         } else {
            const localCart: CartWithItems = getLocalCart() ?? { items: [] }
            const index = findCartItemIndex({ cartItems: localCart.items, productId, variantId })
            const currentCount = getCountInCart({ cartItems: cart?.items, productId, variantId })

            if (currentCount > 1 && index >= 0) {
               localCart.items[index].count = (localCart.items[index].count ?? 0) - 1
               await dispatchCart(localCart)
            } else if (currentCount === 1 && index >= 0) {
               localCart.items.splice(index, 1)
               await dispatchCart(localCart)
            }
         }

         setFetchingCart(false)
      } catch (error) {
         console.error({ error })
         setFetchingCart(false)
      }
   }

   function CartButton() {
      const count = getCountInCart({
         cartItems: cart?.items,
         productId,
         variantId,
      })

      if (fetchingCart) {
         return (
            <Button disabled>
               <Spinner />
            </Button>
         )
      }

      if (count === 0) {
         return <Button onClick={onAddToCart}>🛒 Add to Cart</Button>
      }

      return (
         <>
            <Button variant="outline" size="icon" onClick={onRemoveFromCart}>
               {count === 1 ? (
                  <X className="h-4" />
               ) : (
                  <MinusIcon className="h-4" />
               )}
            </Button>
            <Button disabled variant="ghost" size="icon">
               {count}
            </Button>
            <Button
               disabled={productId === ''}
               variant="outline"
               size="icon"
               onClick={onAddToCart}
            >
               <PlusIcon className="h-4" />
            </Button>
         </>
      )
   }

   function Price() {
      const priceValue = getVariantMinPrice(product)
      const discountValue = product?.discount ?? 0

      if (discountValue > 0 && priceValue > 0) {
         const finalPrice = priceValue - discountValue
         const percentage = (discountValue / priceValue) * 100

         return (
            <div className="flex items-center gap-2">
               <Badge className="flex gap-4" variant="destructive">
                  <div className="line-through">${priceValue}</div>
                  <div>%{percentage.toFixed(2)}</div>
               </Badge>
               <h2>${finalPrice.toFixed(2)}</h2>
            </div>
         )
      }

      return <h2>${priceValue}</h2>
   }

   const productHref =
      product?.slug ? `/products/${product.slug}` : `/products/${product?.id ?? ''}`
   const primaryImage = getPrimaryImageUrl(product)
   const variantForAvailability = getVariantWithStock(product)
   const availability =
      variantForAvailability?.inventory?.quantityOnHand ??
      product?.stock ??
      null

   return (
      <Card>
         <CardHeader className="p-0 md:hidden">
            <div className="relative h-32 w-full">
               <Link href={productHref}>
                  <Image
                     className="rounded-t-lg"
                     src={primaryImage}
                     alt="product image"
                     fill
                     sizes="(min-width: 1000px) 30vw, 50vw"
                     style={{ objectFit: 'cover' }}
                  />
               </Link>
            </div>
         </CardHeader>
         <CardContent className="grid grid-cols-6 gap-4 p-3">
            <div className="relative col-span-2 hidden w-full md:inline-flex">
               <Link href={productHref}>
                  <Image
                     className="rounded-lg"
                     src={primaryImage}
                     alt="item image"
                     fill
                     style={{ objectFit: 'cover' }}
                  />
               </Link>
            </div>
            <div className="col-span-4 block space-y-2">
               <Link href={productHref}>
                  <h2>{product?.title}</h2>
               </Link>
               {variantId && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                     {(() => {
                        const map = variant ? buildVariantOptionMap(variant) : {}
                        const optionDetails =
                           product?.options
                              ?.map((opt) => {
                                 const valId = map[opt.id]
                                 const val = opt.values?.find((v) => v.id === valId)
                                 if (!val) return null
                                 return `${opt.name}: ${val.value}`
                              })
                              .filter(Boolean) ?? []
                        const labelParts = [
                           variant?.title || null,
                           variant?.sku ? `SKU: ${variant.sku}` : null,
                           optionDetails.length ? optionDetails.join(', ') : null,
                        ].filter(Boolean)
                        if (labelParts.length === 0) return 'Variante selezionata'
                        return labelParts.join(' · ')
                     })()}
                  </div>
               )}
               {variantIssues.length > 0 && (
                  <p className="text-xs text-amber-700">
                     {variantIssues.join(' · ')}
                  </p>
               )}
               {availability != null && (
                  <p className="text-xs font-medium text-muted-foreground">
                     Disponibilità: {availability}
                  </p>
               )}
               <p className="text-justify text-xs text-muted-foreground">
                  {product?.description}
               </p>
               <Price />
               <CartButton />
            </div>
         </CardContent>
      </Card>
   )
}
