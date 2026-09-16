import prisma from '@/lib/prisma'
import {
   getPayPalOrder,
   PayPalValidationError,
   reconcilePayPalPayment,
   validatePayPalOrderForLocalOrder,
   verifyPayPalWebhookSignature,
} from '@/lib/paypal'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
   try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID
      const transmissionId = req.headers.get('paypal-transmission-id')
      const transmissionTime = req.headers.get('paypal-transmission-time')
      const signature = req.headers.get('paypal-transmission-sig')
      const certUrl = req.headers.get('paypal-cert-url')
      const authAlgo = req.headers.get('paypal-auth-algo')

      if (!webhookId) {
         return new NextResponse('Webhook not configured', { status: 503 })
      }

      if (!transmissionId || !transmissionTime || !signature || !certUrl || !authAlgo) {
         return new NextResponse('Missing signature headers', { status: 400 })
      }

      const rawBody = await req.text()
      const body = (() => {
         try {
            return JSON.parse(rawBody)
         } catch {
            return null
         }
      })()

      if (!body) {
         return new NextResponse('Invalid payload', { status: 400 })
      }

      const verified = await verifyPayPalWebhookSignature({
         transmissionId,
         transmissionTime,
         transmissionSig: signature,
         certUrl,
         authAlgo,
         webhookId,
         rawBody,
      })

      if (!verified) {
         console.warn(
            JSON.stringify({
               scope: 'paypal',
               stage: 'webhook',
               status: 'verify_failed',
               transmissionId,
            })
         )
         return new NextResponse('Signature verification failed', {
            status: 400,
         })
      }

      const supportedEvents = new Set(['PAYMENT.CAPTURE.COMPLETED'])

      // Minimal shape detection for capture completed events.
      const resource = body.resource ?? {}
      const eventType = body.event_type ?? body.eventType ?? ''
      if (!supportedEvents.has(eventType)) {
         return NextResponse.json({ acknowledged: true, ignored: true })
      }

      const captureId = resource?.id ?? null
      const providerOrderId =
         resource?.supplementary_data?.related_ids?.order_id ?? null

      if (!providerOrderId) {
         console.warn(
            JSON.stringify({
               scope: 'paypal',
               stage: 'webhook',
               status: 'missing_order_id',
               eventType,
               hasCaptureId: Boolean(captureId),
            })
         )
         return NextResponse.json({ acknowledged: true, ignored: true })
      }

      // Fetch provider status to double check completion and get the local order reference.
      const providerOrder = await getPayPalOrder(providerOrderId)

      const isCompleted =
         providerOrder.captureStatus === 'COMPLETED' ||
         providerOrder.status === 'COMPLETED' ||
         eventType === 'PAYMENT.CAPTURE.COMPLETED'

      const payment = await prisma.payment.findUnique({
         where: { refId: providerOrderId },
         include: { order: { include: { payments: true } } },
      })

      const order =
         payment?.order ??
         (providerOrder.referenceId
            ? await prisma.order.findUnique({
                 where: { id: providerOrder.referenceId },
                 include: { payments: true },
              })
            : null)

      // If no local order, just acknowledge.
      if (!order) {
         return NextResponse.json({ acknowledged: true })
      }

      if (providerOrder.referenceId && providerOrder.referenceId !== order.id) {
         return new NextResponse('Provider order mismatch', { status: 409 })
      }

      // If already paid, short-circuit.
      if (order.isPaid) {
         return NextResponse.json({
            acknowledged: true,
            orderId: order.id,
            status: order.status,
            alreadyPaid: true,
         })
      }

      if (!isCompleted) {
         return NextResponse.json({
            acknowledged: true,
            orderId: order.id,
            providerStatus: providerOrder.status ?? null,
            providerCaptureStatus: providerOrder.captureStatus ?? null,
         })
      }

      validatePayPalOrderForLocalOrder({ order, providerOrder })

      await reconcilePayPalPayment({
         prisma,
         order,
         providerOrderId,
         captureId: captureId ?? providerOrder.captureId ?? null,
      })

      console.info(
         JSON.stringify({
            scope: 'paypal',
            stage: 'webhook',
            status: 'paid',
            orderId: order.id,
            providerOrderId,
            eventType,
         })
      )

      return NextResponse.json({
         acknowledged: true,
         orderId: order.id,
         providerOrderId,
         providerCaptureId: captureId ?? providerOrder.captureId ?? null,
      })
   } catch (error) {
      console.error('[PAYPAL_WEBHOOK]', error)
      const message = error instanceof Error ? error.message : 'Internal error'
      return new NextResponse(message, {
         status: error instanceof PayPalValidationError ? 409 : 500,
      })
   }
}
