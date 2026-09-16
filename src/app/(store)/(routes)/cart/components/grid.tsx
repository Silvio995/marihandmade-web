'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useCartContext } from '@/state/Cart'

import { Item } from './item'
import { Receipt } from './receipt'
import { Skeleton } from './skeleton'

export const CartGrid = () => {
   const { loading, cart } = useCartContext()
   const items = cart?.items ?? []

   if (items.length === 0 && !loading) {
      return (
         <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
               <Card>
                  <CardContent className="p-4">
                     <p>Your Cart is empty...</p>
                  </CardContent>
               </Card>
            </div>
            <Receipt />
         </div>
      )
   }

   return (
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
         <div className="md:col-span-2">
            {items.length > 0
               ? items.map((cartItem, index) => (
                    <Item cartItem={cartItem} key={index} />
                 ))
               : [...Array(5)].map((_, index) => <Skeleton key={index} />)}
         </div>
         <Receipt />
      </div>
   )
}