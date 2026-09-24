import { getServerAuthSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'

import { AddressForm } from './components/address-form'

export default async function AddressPage({
   params,
}: {
   params: { addressId: string }
}) {
   const session = await getServerAuthSession()
   if (!session) redirect('/login')
   const address = await prisma.address.findUnique({
      where: {
         id: params.addressId,
         userId: session.user.id,
      },
   })

   if (!address && params.addressId !== 'new') notFound()
   return (
      <div className="flex-col">
         <div className="flex-1 space-y-4 p-8 pt-6">
            <AddressForm initialData={address} />
         </div>
      </div>
   )
}
