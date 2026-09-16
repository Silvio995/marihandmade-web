import prisma from '@/lib/prisma'
import {
   createPayPalOrder,
   resolvePayPalEnvironment,
} from '@/lib/paypal'
import { NextResponse } from 'next/server'
import { resolveOrderPaymentAccess } from '@/lib/order-access'

export async function POST(
   req: Request,
   { params }: { params: { orderId: string } }
) {
   try {
      if (!params.orderId) {
         return new NextResponse('orderId is required', { status: 400 })
      }

      const order = await prisma.order.findUnique({
         where: { id: params.orderId },
         include: {
            payments: true,
            orderItems: {
               include: {
                  variant: {
                     select: {
                        title: true,
                        sku: true,
                     },
                  },
                  product: {
                     select: {
                        title: true,
                     },
                  },
               },
            },
         },
      })

      if (!order) {
         return new NextResponse('Order not found', { status: 404 })
      }

      const access = await resolveOrderPaymentAccess(req, {
         id: order.id,
         userId: order.userId ?? null,
         guestEmail: order.guestEmail ?? null,
      })
      if (!access.authorized) {
         console.error('[ORDER_PAY_PAYPAL_ACCESS_DENIED]', {
            orderId: order.id,
            hasUserId: Boolean(order.userId),
            hasGuestEmail: Boolean(order.guestEmail),
         })
         return new NextResponse('Unauthorized', { status: 401 })
      }

      if (order.status !== 'Pending') {
         return new NextResponse('Order is not payable', { status: 400 })
      }

      const hasSuccessfulPayment = order.payments?.some((p) => p.isSuccessful)
      if (hasSuccessfulPayment) {
         return new NextResponse('Order already paid', { status: 400 })
      }

      const payableAmount = order.payable ?? 0
      if (payableAmount <= 0) {
         return new NextResponse('Order payable amount invalid', { status: 400 })
      }

      const providerOrder = await createPayPalOrder(order)
      if (!providerOrder.id || !providerOrder.approvalUrl) {
         console.error('[ORDER_PAY_PAYPAL_APPROVAL_URL_MISSING]', {
            orderId: order.id,
            providerOrderId: providerOrder.id,
            providerOrderStatus: providerOrder.status,
            providerLinks: providerOrder.raw?.links,
         })
         return new NextResponse('PayPal approval URL missing', { status: 502 })
      }

      return NextResponse.json({
         orderId: order.id,
         provider: 'paypal',
         providerEnvironment: resolvePayPalEnvironment(),
         providerOrderId: providerOrder.id,
         providerOrderStatus: providerOrder.status,
         providerApproveUrl: providerOrder.approvalUrl ?? null,
      })
   } catch (error) {
      console.error('[ORDER_PAY_PAYPAL_CREATE]', error)
      const message =
         error instanceof Error
            ? error.message
            : 'Internal error'
      return new NextResponse(message, { status: 500 })
   }
}
