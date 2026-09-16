import prisma from '@/lib/prisma'
import {
   getPayPalOrder,
   PayPalValidationError,
   reconcilePayPalPayment,
   validatePayPalOrderForLocalOrder,
} from '@/lib/paypal'
import { NextResponse } from 'next/server'
import { resolveOrderPaymentAccess } from '@/lib/order-access'

export async function POST(
   req: Request,
   { params }: { params: { orderId: string } }
) {
   try {
      const url = new URL(req.url)
      const providerOrderId =
         url.searchParams.get('providerOrderId') ??
         url.searchParams.get('token')

      const order = await prisma.order.findUnique({
         where: { id: params.orderId },
         include: {
            payments: true,
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

      const paymentRef =
         providerOrderId ||
         order.payments?.find((p) => p.refId)?.refId ||
         null

      if (!paymentRef) {
         return new NextResponse('providerOrderId is required', { status: 400 })
      }

      const hasSuccessfulPayment = order.payments?.some((p) => p.isSuccessful)
      const hasProviderOrderPayment = order.payments?.some(
         (p) => p.refId === paymentRef
      )

      if (order.isPaid || hasSuccessfulPayment || hasProviderOrderPayment) {
         return NextResponse.json({
            orderId: order.id,
            provider: 'paypal',
            providerOrderId: paymentRef,
            syncStatus: 'ALREADY_PAID',
            isPaid: true,
         })
      }

      const providerOrder = await getPayPalOrder(paymentRef)
      if (providerOrder.referenceId && providerOrder.referenceId !== order.id) {
         return new NextResponse('Provider order mismatch', { status: 409 })
      }

      if (
         providerOrder.captureStatus === 'COMPLETED' ||
         providerOrder.status === 'COMPLETED'
      ) {
         validatePayPalOrderForLocalOrder({ order, providerOrder })

         await reconcilePayPalPayment({
            prisma,
            order,
            providerOrderId: paymentRef,
            captureId: providerOrder.captureId ?? null,
         })
         console.info(
            JSON.stringify({
               scope: 'paypal',
               stage: 'sync',
               status: 'paid',
               orderId: order.id,
               providerOrderId: paymentRef,
               captureId: providerOrder.captureId ?? null,
            })
         )
      }

      return NextResponse.json({
         orderId: order.id,
         provider: 'paypal',
         providerOrderId: providerOrder.id ?? paymentRef,
         providerStatus: providerOrder.status ?? null,
         providerCaptureStatus: providerOrder.captureStatus ?? null,
         providerCaptureId: providerOrder.captureId ?? null,
         isPaid:
            providerOrder.captureStatus === 'COMPLETED' ||
            providerOrder.status === 'COMPLETED',
      })
   } catch (error) {
      console.error('[ORDER_PAY_PAYPAL_SYNC]', error)
      const message = error instanceof Error ? error.message : 'Internal error'
      return new NextResponse(message, {
         status: error instanceof PayPalValidationError ? 409 : 500,
      })
   }
}
