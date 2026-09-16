import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'

export async function GET(
   req: Request,
   { params }: { params: { addressId: string } }
) {
   try {
      const session = await getServerAuthSession()
      const userId = session?.user?.id

      if (!userId) {
         return new NextResponse('Unauthorized', { status: 401 })
      }

      if (!params.addressId) {
         return new NextResponse('addressId is required', { status: 400 })
      }

      const address = await prisma.address.findUniqueOrThrow({
         where: {
            userId,
            id: params.addressId,
         },
      })

      return NextResponse.json(address)
   } catch (error) {
      console.error('[ADDRESS_GET]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}
