'use client'

import { Button } from '@/components/ui/button'
import { useAuthenticated } from '@/hooks/useAuthentication'
import type { ProductWithIncludes } from '@/types/product'
import { HeartIcon } from 'lucide-react'
import { Spinner } from '@/components/native/icons'
import { useState, useEffect } from 'react'

export default function WishlistButton({
   product,
}: {
   product: ProductWithIncludes
}) {
   const { authenticated } = useAuthenticated()
   const [wishlist, setWishlist] = useState<ProductWithIncludes[]>([])
   const [fetchingWishlist, setFetchingWishlist] = useState(true)

   useEffect(() => {
      async function fetchWishlist() {
         if (!authenticated) return
         setFetchingWishlist(true)
         try {
            const res = await fetch('/api/wishlist', { cache: 'no-store' })
            const json: ProductWithIncludes[] = await res.json()
            setWishlist(json)
         } catch (err) {
            console.error(err)
         }
         setFetchingWishlist(false)
      }
      fetchWishlist()
   }, [authenticated])

   if (!authenticated) {
      return <Button disabled>Add to Wishlist (login required)</Button>
   }

   const inWishlist = wishlist.some(
      (item) => item.id === product.id || (item as any).slug === (product as any).slug
   )

   async function toggleWishlist() {
      setFetchingWishlist(true)
      try {
         const method = inWishlist ? 'DELETE' : 'POST'
         const res = await fetch('/api/wishlist', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id }),
         })
         const json: ProductWithIncludes[] = await res.json()
         setWishlist(json)
      } catch (err) {
         console.error(err)
      }
      setFetchingWishlist(false)
   }

   if (fetchingWishlist)
      return (
         <Button disabled>
            <Spinner />
         </Button>
      )

   return (
      <Button
         onClick={toggleWishlist}
         variant={inWishlist ? 'outline' : 'default'}
         className="flex gap-2"
      >
         <HeartIcon className="h-4" />
         {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </Button>
   )
}
