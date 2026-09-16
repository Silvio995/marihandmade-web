import prisma from '@/lib/prisma'
import { getRequiredUserId } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
   _req: Request,
   { params }: { params: { orderId: string } }
) {
   try {
      const userId = await getRequiredUserId()

      if (!userId) {
         return new NextResponse('Unauthorized', { status: 401 })
      }

      if (!params.orderId) {
         return new NextResponse('orderId is required', { status: 400 })
      }

      const order = await prisma.order.findUniqueOrThrow({
         where: {
            userId,
            id: params.orderId,
         },
         include: {
            address: true,
            discountCode: true,
            user: true,
            payments: {
               include: {
                  provider: true,
               },
            },
            orderItems: {
               include: {
                  product: { include: { brand: true, categories: true } },
                  variant: true,
               },
            },
            refund: true,
         },
      })

      return NextResponse.json(order)
   } catch (error) {
      console.error('[ORDER_GET]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}
