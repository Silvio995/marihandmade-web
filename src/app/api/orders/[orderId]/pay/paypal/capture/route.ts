import prisma from '@/lib/prisma'
import {
   capturePayPalOrder,
   getPayPalOrder,
   PayPalValidationError,
   reconcilePayPalPayment,
   validatePayPalOrderForLocalOrder,
} from '@/lib/paypal'
import { NextResponse } from 'next/server'
import { sendOrderEmail } from '@/lib/email'
import { resolveOrderPaymentAccess } from '@/lib/order-access'

export async function POST(
   req: Request,
   { params }: { params: { orderId: string } }
) {
   try {
      const providerOrderId =
         new URL(req.url).searchParams.get('providerOrderId') ??
         new URL(req.url).searchParams.get('token')

      if (!providerOrderId) {
         return new NextResponse('providerOrderId is required', {
            status: 400,
         })
      }

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

      const hasSuccessfulPayment = order.payments?.some((p) => p.isSuccessful)
      const hasProviderOrderPayment = order.payments?.some(
         (p) => p.refId === providerOrderId
      )

      if (order.isPaid || hasSuccessfulPayment || hasProviderOrderPayment) {
         return NextResponse.json({
            orderId: order.id,
            provider: 'paypal',
            providerOrderId,
            captureId: null,
            captureStatus: 'ALREADY_PAID',
            isPaid: true,
         })
      }

      const providerOrder = await getPayPalOrder(providerOrderId)
      if (providerOrder.referenceId && providerOrder.referenceId !== order.id) {
         return new NextResponse('Provider order mismatch', { status: 409 })
      }

      let capture = null as Awaited<ReturnType<typeof capturePayPalOrder>> | null
      if (
         providerOrder.captureStatus === 'COMPLETED' ||
         providerOrder.status === 'COMPLETED'
      ) {
         capture = {
            id: providerOrder.id,
            status: providerOrder.status,
            captureId: providerOrder.captureId,
            captureStatus: providerOrder.captureStatus,
            referenceId: providerOrder.referenceId,
            amountValue: providerOrder.amountValue,
            currencyCode: providerOrder.currencyCode,
            raw: providerOrder.raw,
         }
      } else {
         capture = await capturePayPalOrder(providerOrderId)
      }

      if (capture?.referenceId && capture.referenceId !== order.id) {
         return new NextResponse('Provider order mismatch', { status: 409 })
      }

      if (capture?.captureStatus === 'COMPLETED' || capture?.status === 'COMPLETED') {
         validatePayPalOrderForLocalOrder({ order, providerOrder: capture })

         const reconcileResult = await reconcilePayPalPayment({
            prisma,
            order,
            providerOrderId,
            captureId: capture?.captureId ?? null,
         })
         console.info(
            JSON.stringify({
               scope: 'paypal',
               stage: 'capture',
               status: reconcileResult.alreadyPaid ? 'already_paid' : 'paid',
               orderId: order.id,
               providerOrderId,
               captureId: capture?.captureId ?? null,
            })
         )

         const customerEmail = order.userId
           ? await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } })
           : null
         const emailTo = customerEmail?.email ?? order.guestEmail ?? null
         if (emailTo && !reconcileResult.alreadyPaid) {
           try {
             await sendOrderEmail({
               id: order.id,
               payable: order.payable ?? 0,
               email: emailTo,
               number: order.number ?? undefined,
               tag: 'order-payment',
               subject: 'Payment received',
             })
           } catch (err) {
             console.error('[ORDER_PAYMENT_EMAIL]', err)
           }
         }
      }

      return NextResponse.json({
         orderId: order.id,
         provider: 'paypal',
         providerOrderId,
         captureId: capture?.captureId ?? null,
         captureStatus: capture?.captureStatus ?? capture?.status ?? null,
         isPaid:
            capture?.captureStatus === 'COMPLETED' ||
            capture?.status === 'COMPLETED',
      })
   } catch (error) {
      console.error('[ORDER_PAY_PAYPAL_CAPTURE]', error)
      const message = error instanceof Error ? error.message : 'Internal error'
      return new NextResponse(message, {
         status: error instanceof PayPalValidationError ? 409 : 500,
      })
   }
}
