'use client'

import { Separator } from '@/components/native/separator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useCartContext } from '@/state/Cart'
import Link from 'next/link'

type ProductType = {
   price?: number
   discount?: number
}

type CartItemType = {
   count?: number
   product?: ProductType
}

export function Receipt() {
   const { loading, cart } = useCartContext()

   const items = (cart?.items ?? []) as CartItemType[]
   const hasItems = items.length > 0

   function calculatePayableCost() {
      let totalAmount = 0
      let discountAmount = 0

      for (const item of items) {
         const count = item?.count ?? 0
         const price = item?.product?.price ?? 0
         const discount = item?.product?.discount ?? 0

         totalAmount += count * price
         discountAmount += count * discount
      }

      const afterDiscountAmount = totalAmount - discountAmount
      const taxAmount = afterDiscountAmount * 0.09
      const payableAmount = afterDiscountAmount + taxAmount

      return {
         totalAmount: totalAmount.toFixed(2),
         discountAmount: discountAmount.toFixed(2),
         afterDiscountAmount: afterDiscountAmount.toFixed(2),
         taxAmount: taxAmount.toFixed(2),
         payableAmount: payableAmount.toFixed(2),
      }
   }

   const costs = calculatePayableCost()

   return (
      <Card className={loading ? 'animate-pulse' : undefined}>
         <CardHeader className="p-4 pb-0">
            <h2 className="font-bold tracking-tight">Receipt</h2>
         </CardHeader>
         <CardContent className="p-4 text-sm">
            <div className="block space-y-[1vh]">
               <div className="flex justify-between">
                  <p>Total Amount</p>
                  <h3>${costs.totalAmount}</h3>
               </div>
               <div className="flex justify-between">
                  <p>Discount Amount</p>
                  <h3>${costs.discountAmount}</h3>
               </div>
               <div className="flex justify-between">
                  <p>Tax Amount</p>
                  <h3>${costs.taxAmount}</h3>
               </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between">
               <p>Payable Amount</p>
               <h3>${costs.payableAmount}</h3>
            </div>
         </CardContent>
         <Separator />
         <CardFooter>
            <Link href="/checkout" className="w-full">
               <Button disabled={!hasItems} className="w-full">
                  Checkout ospite
               </Button>
            </Link>
         </CardFooter>
      </Card>
   )
}
