'use client'

import { CartContextProvider } from '@/state/Cart'
import { UserContextProvider } from '@/state/User'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserContextProvider>
        <CartContextProvider>
          {children}
          <Toaster position="top-right" />
        </CartContextProvider>
      </UserContextProvider>
    </SessionProvider>
  )
}
