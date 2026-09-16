'use client'

import { useSession } from 'next-auth/react'

export function useAuthenticated() {
   const { status } = useSession()
   return { authenticated: status === 'authenticated' }
}
