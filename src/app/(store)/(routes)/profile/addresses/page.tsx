import { getServerAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AddressesClient from './components/addresses-client'

export const dynamic = 'force-dynamic'

export default async function AddressesPage() {
  const session = await getServerAuthSession()
  if (!session?.user?.id) redirect('/login')

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Indirizzi</h1>
      <AddressesClient initialAddresses={addresses} />
    </div>
  )
}
