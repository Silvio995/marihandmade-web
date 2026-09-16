'use client'

import { useAuthenticated } from '@/hooks/useAuthentication'
import { isVariableValid } from '@/lib/utils'
import { useUserContext } from '@/state/User'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProductGrid, ProductSkeletonGrid } from '@/components/native/ProductGrid'

export default function User() {
   const { authenticated } = useAuthenticated()
   const { user, loading } = useUserContext()

   const [items, setItems] = useState<any[] | null>(null)
   const [fetching, setFetching] = useState(false)
   const router = useRouter()

   useEffect(() => {
      if (!loading && !isVariableValid(user)) router.push('/')
   }, [user, loading, router])

   useEffect(() => {
      async function getWishlist() {
         try {
            setFetching(true)
            const response = await fetch(`/api/wishlist`, {
               cache: 'no-store',
            })

            const json = await response.json()

            setItems(json ?? [])
         } catch (error) {
            console.error({ error })
            setItems(null)
         } finally {
            setFetching(false)
         }
      }

      if (authenticated) getWishlist()
   }, [authenticated])

   if (!authenticated && !loading) {
      router.push('/login')
      return null
   }

   if (fetching || loading) {
      return (
         <div className="p-6">
            <h1 className="mb-4 text-2xl font-semibold">Wishlist</h1>
            <ProductSkeletonGrid />
         </div>
      )
   }

   if (!items || items.length === 0) {
      return (
         <div className="p-6">
            <h1 className="mb-4 text-2xl font-semibold">Wishlist</h1>
            <p className="text-sm text-neutral-600">
               Nessun articolo in wishlist.
            </p>
         </div>
      )
   }

   return (
      <div className="p-6">
         <h1 className="mb-4 text-2xl font-semibold">Wishlist</h1>
         <ProductGrid products={items as any} />
      </div>
   )
}
