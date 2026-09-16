import { useAuthenticated } from '@/hooks/useAuthentication'
import { isVariableValid } from '@/lib/utils'
import type { UserWithIncludes } from '@/types/prisma'
import React, { createContext, useContext, useEffect, useState } from 'react'

type UserContextValue = {
   user: UserWithIncludes | null
   loading: boolean
   refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
   user: null,
   loading: true,
   refreshUser: async () => {},
})

export const useUserContext = () => {
   return useContext(UserContext)
}

export const UserContextProvider = ({
   children,
}: {
   children: React.ReactNode
}) => {
   const { authenticated } = useAuthenticated()

   const [user, setUser] = useState<UserWithIncludes | null>(null)
   const [loading, setLoading] = useState(true)

   const refreshUser = async () => {
      try {
         if (!authenticated) return
         setLoading(true)

         const response = await fetch(`/api/profile`, {
            cache: 'no-store',
         })

         const json: UserWithIncludes = await response.json()

         if (isVariableValid(json)) {
            setUser(json)
         }
      } catch (error) {
         console.error({ error })
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      const fetchData = async () => {
         try {
            const response = await fetch(`/api/profile`, {
               cache: 'no-store',
            })

            const json: UserWithIncludes = await response.json()

            if (isVariableValid(json)) {
               setUser(json)
            }
         } catch (error) {
            console.error({ error })
         } finally {
            setLoading(false)
         }
      }

      if (authenticated) {
         fetchData()
      } else {
         setLoading(false)
      }
   }, [authenticated])

   return (
      <UserContext.Provider value={{ user, loading, refreshUser }}>
         {children}
      </UserContext.Provider>
   )
}
