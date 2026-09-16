import { getLocalCart, writeLocalCart } from '@/lib/cart'
import { isVariableValid } from '@/lib/utils'
import type { CartSummary } from '@/types/prisma'
import { useUserContext } from '@/state/User'
import React, { createContext, useContext, useEffect, useState } from 'react'

type CartContextType = {
   cart: CartSummary | null
   loading: boolean
   refreshCart: () => Promise<void>
   dispatchCart: (cart: CartSummary | null) => Promise<void>
}

const CartContext = createContext<CartContextType>({
   cart: null,
   loading: true,
   refreshCart: async () => {},
   dispatchCart: async () => {},
})

export const useCartContext = () => {
   return useContext(CartContext)
}

export const CartContextProvider = ({
   children,
}: {
   children: React.ReactNode
}) => {
   const { user } = useUserContext()

   const [cart, setCart] = useState<CartSummary | null>(null)
   const [loading, setLoading] = useState(true)

   const dispatchCart = async (nextCart: CartSummary | null) => {
      setCart(nextCart)
      writeLocalCart(nextCart)
   }

   const refreshCart = async () => {
      setLoading(true)

      if (isVariableValid(user)) {
         const nextCart = user?.cart ?? { items: [] }
         setCart(nextCart)
         writeLocalCart(nextCart)
      } else {
         const localCart = getLocalCart() ?? { items: [] }
         setCart(localCart)
      }

      setLoading(false)
   }

   useEffect(() => {
      const syncGuestCart = async () => {
         const localCart = getLocalCart()
         const serverCart = user?.cart ?? { items: [] }

      if (!isVariableValid(user)) {
         setCart(localCart ?? { items: [] })
         setLoading(false)
         return
      }

      const itemsToSync =
         localCart?.items
            ?.filter((item) => item?.productId && (item?.count ?? 0) > 0)
            .map((item) => ({
               productId: item.productId,
               variantId: item.variantId ?? null,
               count: item.count ?? 0,
               merge: true,
            })) ?? []

      if (!itemsToSync.length) {
         setCart(serverCart ?? { items: [] })
         setLoading(false)
         return
      }

      try {
         const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsToSync }),
         })

         if (!response.ok) throw new Error('Failed to sync guest cart')

         const nextCart: CartSummary = await response.json()
         await dispatchCart(nextCart)
         writeLocalCart(null) // clear guest cart after merge + persist
      } catch (error) {
         console.error('[SYNC_GUEST_CART]', error)
         setCart(serverCart ?? { items: [] })
      }
      setLoading(false)
   }

   syncGuestCart()
   }, [user])

   return (
      <CartContext.Provider
         value={{ cart, loading, refreshCart, dispatchCart }}
      >
         {children}
      </CartContext.Provider>
   )
}
