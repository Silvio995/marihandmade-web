import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { buildPayPalCreateOrderPayload } from '@/lib/paypal'
import { resolveOrderPaymentAccess } from '@/lib/order-access'
import { resolvePayPalEnvironment, resolvePayPalReturnBaseUrl } from '@/lib/paypal'

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

      const baseUrl = resolvePayPalReturnBaseUrl()

      return NextResponse.json({
         orderId: order.id,
         status: 'ready',
         currency: 'USD',
         amount: payableAmount,
         items: order.orderItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.count,
         })),
         provider: 'paypal',
         providerEnvironment: resolvePayPalEnvironment(),
         providerIntent: 'CAPTURE',
         providerSupportedActions: ['create_order'],
         providerPayloads: {
            paypal: buildPayPalCreateOrderPayload(order, {
               returnUrl: `${baseUrl}/pay/paypal/return?orderId=${order.id}`,
               cancelUrl: `${baseUrl}/order-confirmation?orderId=${order.id}`,
            }),
         },
      })
   } catch (error) {
      console.error('[ORDER_PAY_INIT]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}
