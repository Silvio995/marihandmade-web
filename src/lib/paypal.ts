import { Buffer } from 'buffer'
import type { Order, OrderItem, Payment, PrismaClient, Product, ProductVariant } from '@/generated/client'
import { getOptionalEnv, isProductionEnvironment, requireEnv } from '@/lib/env'

type PayPalMoney = {
   currency_code: PayPalCurrencyCode
   value: string
}

type PayPalItem = {
   name: string
   sku?: string | null
   quantity: string
   unit_amount: PayPalMoney
}

type PayPalAmountBreakdown = {
   item_total: PayPalMoney
   tax_total: PayPalMoney
   shipping: PayPalMoney
   discount?: PayPalMoney
}

type PayPalPurchaseUnit = {
   reference_id: string
   invoice_id: string
   amount: {
      currency_code: PayPalCurrencyCode
      value: string
      breakdown: PayPalAmountBreakdown
   }
   items: PayPalItem[]
}

export type PayPalCreateOrderPayload = {
   intent: 'CAPTURE'
   purchase_units: [PayPalPurchaseUnit]
   application_context: {
      shipping_preference: 'NO_SHIPPING'
      return_url?: string
      cancel_url?: string
   }
}

type OrderItemForPayPal = OrderItem & {
   product?: Pick<Product, 'title'> | null
   variant?: Pick<ProductVariant, 'title' | 'sku'> | null
}

export type OrderForPayPal = Order & { orderItems: OrderItemForPayPal[] }

type PayPalCurrencyCode = 'EUR' | 'USD'

const DEFAULT_API_BASE_URL = 'https://api-m.sandbox.paypal.com'
const DEFAULT_SITE_BASE_URL = 'http://localhost:3000'
const DEFAULT_CURRENCY_CODE: PayPalCurrencyCode = 'EUR'
const SUPPORTED_CURRENCY_CODES = new Set<PayPalCurrencyCode>(['EUR', 'USD'])

export class PayPalValidationError extends Error {
   constructor(message: string) {
      super(message)
      this.name = 'PayPalValidationError'
   }
}

function trimTrailingSlash(value: string) {
   return value.replace(/\/$/, '')
}

export function resolvePayPalApiBaseUrl() {
   const configured = getOptionalEnv('PAYPAL_API_BASE_URL')
   if (configured) {
      return configured
   }

   if (isProductionEnvironment) {
      throw new Error('[ENV] Missing required env var PAYPAL_API_BASE_URL')
   }

   return DEFAULT_API_BASE_URL
}

export function resolvePayPalReturnBaseUrl() {
   const configured =
      getOptionalEnv('PAYPAL_RETURN_BASE_URL') ??
      getOptionalEnv('NEXT_PUBLIC_URL') ??
      getOptionalEnv('NEXT_PUBLIC_APP_URL')

   if (configured) {
      return trimTrailingSlash(configured)
   }

   if (isProductionEnvironment) {
      throw new Error(
         '[ENV] Missing required env var PAYPAL_RETURN_BASE_URL (or NEXT_PUBLIC_URL / NEXT_PUBLIC_APP_URL)'
      )
   }

   return DEFAULT_SITE_BASE_URL
}

export function resolvePayPalCurrencyCode(): PayPalCurrencyCode {
   const configured = getOptionalEnv('PAYPAL_CURRENCY_CODE')

   if (!configured) {
      if (isProductionEnvironment) {
         throw new Error('[ENV] Missing required env var PAYPAL_CURRENCY_CODE')
      }

      return DEFAULT_CURRENCY_CODE
   }

   const normalized = configured.toUpperCase()
   if (!SUPPORTED_CURRENCY_CODES.has(normalized as PayPalCurrencyCode)) {
      throw new Error(
         `[ENV] Unsupported PAYPAL_CURRENCY_CODE ${configured}. Supported values: EUR, USD`
      )
   }

   return normalized as PayPalCurrencyCode
}

function toCents(value: number | string | null | undefined) {
   const numericValue =
      typeof value === 'number'
         ? value
         : typeof value === 'string'
           ? Number(value)
           : NaN

   if (!Number.isFinite(numericValue)) {
      return null
   }

   return Math.round(numericValue * 100)
}

export function validatePayPalOrderForLocalOrder(params: {
   order: Pick<Order, 'id' | 'payable'>
   providerOrder: {
      referenceId?: string | null
      amountValue?: string | null
      currencyCode?: string | null
   }
}) {
   const { order, providerOrder } = params
   const expectedCurrency = resolvePayPalCurrencyCode()

   if (!providerOrder.referenceId) {
      throw new PayPalValidationError(
         'PayPal order missing purchase unit reference_id'
      )
   }

   if (providerOrder.referenceId !== order.id) {
      throw new PayPalValidationError(
         'PayPal order reference_id does not match local order'
      )
   }

   if (!providerOrder.amountValue) {
      throw new PayPalValidationError('PayPal order missing purchase unit amount')
   }

   const expectedAmount = toCents(order.payable ?? 0)
   const providerAmount = toCents(providerOrder.amountValue)
   if (expectedAmount === null || providerAmount === null) {
      throw new PayPalValidationError('PayPal order amount is invalid')
   }

   if (providerAmount !== expectedAmount) {
      throw new PayPalValidationError(
         'PayPal order amount does not match local order payable'
      )
   }

   if (providerOrder.currencyCode !== expectedCurrency) {
      throw new PayPalValidationError(
         'PayPal order currency does not match configured currency'
      )
   }
}

export function buildPayPalCreateOrderPayload(
   order: OrderForPayPal,
   options?: { returnUrl?: string; cancelUrl?: string }
): PayPalCreateOrderPayload {
   const currencyCode = resolvePayPalCurrencyCode()
   const grossItems = (order.orderItems ?? []).map<PayPalItem>((item, index) => {
      const unitPrice = Math.max(item.price ?? 0, 0)

      return {
         name:
            item.variant?.title ??
            item.product?.title ??
            `Item #${index + 1}`,
         sku: item.variant?.sku ?? item.productId,
         quantity: Math.max(item.count ?? 0, 0).toString(),
         unit_amount: {
            currency_code: currencyCode,
            value: unitPrice.toFixed(2),
         },
      }
   })

   const itemTotal = grossItems.reduce((sum, item) => {
      return sum + Number(item.unit_amount.value) * Number(item.quantity)
   }, 0)

   const discountValue = Math.max(order.discount ?? 0, 0)
   const taxTotal = Math.max(order.tax ?? 0, 0)
   const shippingTotal = Math.max(order.shipping ?? 0, 0)
   const amountValue = Math.max(
      itemTotal + taxTotal + shippingTotal - discountValue,
      0
   )

   const breakdown: PayPalAmountBreakdown = {
      item_total: { currency_code: currencyCode, value: itemTotal.toFixed(2) },
      tax_total: { currency_code: currencyCode, value: taxTotal.toFixed(2) },
      shipping: {
         currency_code: currencyCode,
         value: shippingTotal.toFixed(2),
      },
      ...(discountValue > 0
         ? {
              discount: {
                 currency_code: currencyCode,
                 value: discountValue.toFixed(2),
              },
           }
         : {}),
   }

   return {
      intent: 'CAPTURE',
      purchase_units: [
         {
            reference_id: order.id,
            invoice_id: order.number?.toString() ?? order.id,
            amount: {
               currency_code: currencyCode,
               value: amountValue.toFixed(2),
               breakdown,
            },
            items: grossItems,
         },
      ],
      application_context: {
         shipping_preference: 'NO_SHIPPING',
         ...(options?.returnUrl && { return_url: options.returnUrl }),
         ...(options?.cancelUrl && { cancel_url: options.cancelUrl }),
      },
   }
}

export function resolvePayPalEnvironment() {
   return resolvePayPalApiBaseUrl().includes('sandbox') ? 'sandbox' : 'live'
}

async function sleep(ms: number) {
   return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableStatus(status: number) {
   return status === 429 || status >= 500
}

async function paypalApiFetch(
   url: string,
   init: RequestInit,
   opts?: { retries?: number; attempt?: number }
): Promise<Response> {
   const retries = opts?.retries ?? 2
   const attempt = opts?.attempt ?? 0
   try {
      const res = await fetch(url, init)
      if (!res.ok && isRetryableStatus(res.status) && attempt < retries) {
         console.warn(
            JSON.stringify({
               scope: 'paypal',
               stage: 'http',
               status: 'retry',
               attempt: attempt + 1,
               reason: `status ${res.status}`,
               url,
            })
         )
         await sleep(150 * (attempt + 1))
         return paypalApiFetch(url, init, { retries, attempt: attempt + 1 })
      }
      return res
   } catch (err) {
      if (attempt < retries) {
         console.warn(
            JSON.stringify({
               scope: 'paypal',
               stage: 'http',
               status: 'retry',
               attempt: attempt + 1,
               reason: err instanceof Error ? err.message : String(err),
               url,
            })
         )
         await sleep(150 * (attempt + 1))
         return paypalApiFetch(url, init, { retries, attempt: attempt + 1 })
      }
      throw err
   }
}

export async function getPayPalAccessToken() {
   const clientId = getOptionalEnv('PAYPAL_CLIENT_ID')
   const clientSecret = getOptionalEnv('PAYPAL_CLIENT_SECRET')

   if (!clientId || !clientSecret) {
      throw new Error('[ENV] Missing required env vars PAYPAL_CLIENT_ID and/or PAYPAL_CLIENT_SECRET')
   }

   const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
   )

   const response = await paypalApiFetch(
      `${resolvePayPalApiBaseUrl()}/v1/oauth2/token`,
      {
         method: 'POST',
         headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: new URLSearchParams({
            grant_type: 'client_credentials',
         }),
      }
   )

   if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
         `PayPal token request failed: ${response.status} ${response.statusText} ${errorText}`
      )
   }

   const json = (await response.json()) as { access_token?: string }
   if (!json?.access_token) {
      throw new Error('PayPal token missing from response')
   }

   return json.access_token
}

export async function createPayPalOrder(order: OrderForPayPal) {
   const accessToken = await getPayPalAccessToken()
   const siteBaseUrl = resolvePayPalReturnBaseUrl()
   const returnUrl = `${siteBaseUrl}/pay/paypal/return?orderId=${order.id}`
   const cancelUrl = `${siteBaseUrl}/order-confirmation?orderId=${order.id}`
   const payload = buildPayPalCreateOrderPayload(order, { returnUrl, cancelUrl })

   const response = await paypalApiFetch(
      `${resolvePayPalApiBaseUrl()}/v2/checkout/orders`,
      {
         method: 'POST',
         headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(payload),
      }
   )

   if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
         `PayPal order create failed: ${response.status} ${response.statusText} ${errorText}`
      )
   }

   const json = (await response.json()) as {
      id?: string
      status?: string
      links?: Array<{ rel?: string; href?: string }>
   }

   return {
      id: json?.id ?? null,
      status: json?.status ?? null,
      // PayPal can return either `approve` or `payer-action` depending on context.
      approvalUrl: json?.links?.find(
         (link) => link.rel === 'approve' || link.rel === 'payer-action'
      )?.href,
      raw: json,
   }
}

export async function getPayPalOrder(providerOrderId: string) {
   if (!providerOrderId) {
      throw new Error('PayPal order id is required')
   }

   const accessToken = await getPayPalAccessToken()

   const response = await paypalApiFetch(
      `${resolvePayPalApiBaseUrl()}/v2/checkout/orders/${providerOrderId}`,
      {
         method: 'GET',
         headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
         },
      }
   )

   if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
         `PayPal order fetch failed: ${response.status} ${response.statusText} ${errorText}`
      )
   }

   const json = (await response.json()) as {
      id?: string
      status?: string
      purchase_units?: Array<{
         reference_id?: string
         amount?: { currency_code?: string; value?: string }
         payments?: {
            captures?: Array<{
               id?: string
               status?: string
               amount?: { currency_code?: string; value?: string }
            }>
         }
      }>
   }

   const purchaseUnit = json?.purchase_units?.[0]
   const capture = purchaseUnit?.payments?.captures?.[0] ?? undefined
   const amount = purchaseUnit?.amount ?? capture?.amount

   return {
      id: json?.id ?? null,
      status: json?.status ?? null,
      referenceId: purchaseUnit?.reference_id ?? null,
      amountValue: amount?.value ?? null,
      currencyCode: amount?.currency_code ?? null,
      captureId: capture?.id ?? null,
      captureStatus: capture?.status ?? null,
      raw: json,
   }
}

export async function capturePayPalOrder(providerOrderId: string) {
   if (!providerOrderId) {
      throw new Error('PayPal order id is required for capture')
   }

   const accessToken = await getPayPalAccessToken()

   const response = await paypalApiFetch(
      `${resolvePayPalApiBaseUrl()}/v2/checkout/orders/${providerOrderId}/capture`,
      {
         method: 'POST',
         headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
         },
      }
   )

   if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
         `PayPal order capture failed: ${response.status} ${response.statusText} ${errorText}`
      )
   }

   const json = (await response.json()) as {
      id?: string
      status?: string
      purchase_units?: Array<{
         reference_id?: string
         amount?: { currency_code?: string; value?: string }
         payments?: {
            captures?: Array<{
               id?: string
               status?: string
               amount?: { currency_code?: string; value?: string }
            }>
         }
      }>
   }

   const purchaseUnit = json?.purchase_units?.[0]
   const capture = purchaseUnit?.payments?.captures?.[0] ?? undefined
   const amount = purchaseUnit?.amount ?? capture?.amount

   return {
      id: json?.id ?? null,
      status: json?.status ?? null,
      referenceId: purchaseUnit?.reference_id ?? null,
      amountValue: amount?.value ?? null,
      currencyCode: amount?.currency_code ?? null,
      captureId: capture?.id ?? null,
      captureStatus: capture?.status ?? null,
      raw: json,
   }
}

type PrismaLike = Pick<PrismaClient, '$transaction'> & {
   paymentProvider: PrismaClient['paymentProvider']
   payment: PrismaClient['payment']
   order: PrismaClient['order']
}

export async function reconcilePayPalPayment(params: {
   prisma: PrismaLike
   order: Order & { payments?: Payment[] | null }
   providerOrderId: string
   captureId?: string | null
}) {
   const { prisma, order, providerOrderId, captureId } = params

   const hasSuccessfulPayment =
      order.isPaid ||
      (order.payments ?? []).some((p) => p.isSuccessful || p.refId === providerOrderId)

   if (hasSuccessfulPayment) {
      console.info(
         JSON.stringify({
            scope: 'paypal',
            stage: 'reconcile',
            status: 'already_paid',
            orderId: order.id,
            providerOrderId,
         })
      )
      return { alreadyPaid: true }
   }

   await prisma.$transaction(async (tx) => {
      const provider = await tx.paymentProvider.upsert({
         where: { title: 'PayPal' },
         update: {},
         create: {
            title: 'PayPal',
            isActive: true,
            websiteUrl: 'https://www.paypal.com',
         },
      })

      if (!order.userId) {
         await tx.$executeRaw`
            INSERT INTO "Payment" (
               "status",
               "refId",
               "cardPan",
               "isSuccessful",
               "payable",
               "providerId",
               "userId",
               "orderId"
            )
            VALUES (
               CAST(${'Paid'} AS "PaymentStatusEnum"),
               ${providerOrderId},
               ${captureId ?? null},
               ${true},
               ${order.payable ?? 0},
               ${provider.id},
               ${null},
               ${order.id}
            )
            ON CONFLICT ("refId") DO UPDATE
            SET
               "status" = EXCLUDED."status",
               "cardPan" = EXCLUDED."cardPan",
               "isSuccessful" = EXCLUDED."isSuccessful",
               "payable" = EXCLUDED."payable",
               "providerId" = EXCLUDED."providerId",
               "userId" = EXCLUDED."userId",
               "orderId" = EXCLUDED."orderId",
               "updatedAt" = CURRENT_TIMESTAMP
         `
      } else {
         await tx.payment.upsert({
            where: { refId: providerOrderId },
            update: {
               status: 'Paid',
               isSuccessful: true,
               payable: order.payable ?? 0,
               orderId: order.id,
               userId: order.userId,
               providerId: provider.id,
               // Legacy schema note: cardPan is temporarily reused to persist PayPal captureId.
               // Replace this with a dedicated captureId/reference column in a later payment schema pass.
               cardPan: captureId ?? null,
            },
            create: {
               refId: providerOrderId,
               status: 'Paid',
               isSuccessful: true,
               payable: order.payable ?? 0,
               orderId: order.id,
               userId: order.userId,
               providerId: provider.id,
               // Legacy schema note: cardPan is temporarily reused to persist PayPal captureId.
               // Replace this with a dedicated captureId/reference column in a later payment schema pass.
               cardPan: captureId ?? null,
            },
         })
      }

      await tx.order.update({
         where: { id: order.id },
         data: {
            isPaid: true,
            status: 'Processing',
         },
      })
   })

   console.info(
      JSON.stringify({
         scope: 'paypal',
         stage: 'reconcile',
         status: 'paid',
         orderId: order.id,
         providerOrderId,
         captureId,
      })
   )

   return { processed: true }
}

export async function verifyPayPalWebhookSignature(params: {
   transmissionId: string
   transmissionTime: string
   transmissionSig: string
   certUrl: string
   authAlgo: string
   webhookId: string
   rawBody: string
}) {
   if (isProductionEnvironment) {
      requireEnv('PAYPAL_WEBHOOK_ID')
   }

   const accessToken = await getPayPalAccessToken()
   const response = await paypalApiFetch(
      `${resolvePayPalApiBaseUrl()}/v1/notifications/verify-webhook-signature`,
      {
         method: 'POST',
         headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            auth_algo: params.authAlgo,
            cert_url: params.certUrl,
            transmission_id: params.transmissionId,
            transmission_sig: params.transmissionSig,
            transmission_time: params.transmissionTime,
            webhook_id: params.webhookId,
            webhook_event: JSON.parse(params.rawBody),
         }),
      }
   )

   if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
         `PayPal webhook verify failed: ${response.status} ${response.statusText} ${errorText}`
      )
   }

   const json = (await response.json()) as { verification_status?: string }
   return json?.verification_status === 'SUCCESS'
}
