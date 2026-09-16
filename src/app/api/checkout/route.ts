import { getCurrentUserId } from '@/lib/auth'
import { isLegacyProductPurchasable, isVariantPurchasable } from '@/lib/inventory-availability'
import prisma from '@/lib/prisma'
import { withPublicProductWhere } from '@/lib/public-products'
import { NextResponse } from 'next/server'

type CheckoutLineInput = {
   productId: string
   variantId?: string | null
   quantity?: number
   count?: number
}

type RequestedLine = {
   productId: string
   variantId: string | null
   quantity: number
}

type CheckoutLine = {
   productId: string
   variantId: string | null
   sku?: string | null
   imageUrl?: string | null
   productTitle: string | null
   variantTitle: string | null
   isVariantBacked: boolean
   quantity: number
   unitPrice: number
   unitCompareAtPrice?: number | null
   subtotal: number
}

function normalizeLineInputs(lines: CheckoutLineInput[]): RequestedLine[] | null {
   const merged = new Map<string, RequestedLine>()

   for (const line of lines) {
      if (!line || typeof line.productId !== 'string') return null
      const quantity = Number(line.quantity ?? line.count ?? 0)
      if (!Number.isInteger(quantity) || quantity <= 0) return null
      const productId = line.productId
      const variantId = line.variantId ?? null
      const key = `${productId}::${variantId ?? 'null'}`
      const existing = merged.get(key)
      if (existing) {
         existing.quantity += quantity
      } else {
         merged.set(key, { productId, variantId, quantity })
      }
   }

   return Array.from(merged.values())
}

async function getRequestedLinesFromUserCart(userId: string): Promise<RequestedLine[]> {
   const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
         items: {
            select: {
               productId: true,
               variantId: true,
               count: true,
            },
         },
      },
   })

   return (cart?.items ?? [])
      .filter((item) => (item.count ?? 0) > 0)
      .map((item) => ({
         productId: item.productId,
         variantId: item.variantId ?? null,
         quantity: item.count,
      }))
}

function getCoverImage(product: {
   productImages?: Array<{ url: string; isCover: boolean; position: number | null }>
   images?: string[]
}) {
   const cover =
      product.productImages?.find((img) => img?.isCover) ??
      [...(product.productImages ?? [])].sort(
         (a, b) => (a?.position ?? 0) - (b?.position ?? 0)
      )[0]
   return cover?.url ?? product.images?.[0] ?? null
}

async function resolveCheckoutLines(requestedLines: RequestedLine[]) {
   const productIds = Array.from(new Set(requestedLines.map((line) => line.productId)))
   if (!productIds.length) {
      return {
         lines: [] as CheckoutLine[],
         droppedLineCount: 0,
         droppedReasons: [] as string[],
         itemCount: 0,
      }
   }

   const products = await prisma.product.findMany({
      where: withPublicProductWhere({
         id: {
            in: productIds,
         },
      }),
      select: {
         id: true,
         title: true,
         price: true,
         stock: true,
         isAvailable: true,
         images: true,
         productImages: {
            select: { url: true, isCover: true, position: true },
         },
         variants: {
            select: {
               id: true,
               productId: true,
               title: true,
               price: true,
               compareAtPrice: true,
               active: true,
               sku: true,
               inventory: {
                  select: {
                     quantityOnHand: true,
                     quantityReserved: true,
                     trackQuantity: true,
                     allowBackorder: true,
                  },
               },
            },
         },
      },
   })

   const productMap = new Map(products.map((product) => [product.id, product]))
   const lines: CheckoutLine[] = []
   const droppedReasons = new Set<string>()
   let droppedLineCount = 0
   let itemCount = 0

   for (const requestedLine of requestedLines) {
      const product = productMap.get(requestedLine.productId)
      if (!product) {
         droppedLineCount++
         droppedReasons.add('invalid_or_unpublished_product')
         continue
      }

      const resolvedVariant = requestedLine.variantId
         ? product.variants?.find(
              (variant) =>
                 variant.id === requestedLine.variantId &&
                 variant.productId === product.id &&
                 variant.active
           ) ?? null
         : null

      if (requestedLine.variantId && !resolvedVariant) {
         droppedLineCount++
         droppedReasons.add('inactive_or_mismatched_variant')
         continue
      }

      if (resolvedVariant && !isVariantPurchasable(resolvedVariant, requestedLine.quantity)) {
         droppedLineCount++
         droppedReasons.add('insufficient_variant_inventory')
         continue
      }

      if (!resolvedVariant && !isLegacyProductPurchasable(product, requestedLine.quantity)) {
         droppedLineCount++
         droppedReasons.add('insufficient_legacy_stock')
         continue
      }

      const priceSource = resolvedVariant ?? product
      itemCount += requestedLine.quantity
      lines.push({
         productId: product.id,
         variantId: resolvedVariant?.id ?? null,
         sku: resolvedVariant?.sku ?? null,
         imageUrl: getCoverImage(product),
         unitCompareAtPrice: resolvedVariant?.compareAtPrice ?? null,
         productTitle: product.title ?? null,
         variantTitle: resolvedVariant?.title ?? null,
         isVariantBacked: Boolean(resolvedVariant),
         quantity: requestedLine.quantity,
         unitPrice: priceSource.price ?? 0,
         subtotal: requestedLine.quantity * (priceSource.price ?? 0),
      })
   }

   return {
      lines,
      droppedLineCount,
      droppedReasons: Array.from(droppedReasons),
      itemCount,
   }
}

export async function GET(_req: Request) {
   try {
      const userId = await getCurrentUserId()
      if (!userId) {
         return new NextResponse('Unauthorized', { status: 401 })
      }

      const requestedLines = await getRequestedLinesFromUserCart(userId)
      const normalized = await resolveCheckoutLines(requestedLines)

      return NextResponse.json({
         items: normalized.lines,
         lines: normalized.lines,
         lineCount: normalized.lines.length,
         itemCount: normalized.itemCount,
         droppedLineCount: normalized.droppedLineCount,
         hasDroppedLines: normalized.droppedLineCount > 0,
         isCheckoutReady: normalized.droppedLineCount === 0,
         requiresCartReview: normalized.droppedLineCount > 0,
         droppedReasons: normalized.droppedReasons,
      })
   } catch (error) {
      console.error('[CHECKOUT_CART_PREP_GET]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}

export async function POST(req: Request) {
   try {
      const userId = await getCurrentUserId()
      const body = (await req.json().catch(() => ({}))) as {
         lines?: CheckoutLineInput[]
         items?: CheckoutLineInput[]
         checkoutLines?: CheckoutLineInput[]
      }

      const submittedLines = body.lines ?? body.checkoutLines ?? body.items ?? []
      const hasSubmittedLines = Array.isArray(submittedLines) && submittedLines.length > 0

      let requestedLines: RequestedLine[] = []
      if (hasSubmittedLines) {
         const normalizedInput = normalizeLineInputs(submittedLines)
         if (!normalizedInput) {
            return new NextResponse('Invalid checkout lines', { status: 400 })
         }
         requestedLines = normalizedInput
      } else if (userId) {
         requestedLines = await getRequestedLinesFromUserCart(userId)
      } else {
         return new NextResponse('Cart is empty or invalid for checkout', { status: 400 })
      }

      const normalized = await resolveCheckoutLines(requestedLines)

      return NextResponse.json({
         items: normalized.lines,
         lines: normalized.lines,
         lineCount: normalized.lines.length,
         itemCount: normalized.itemCount,
         droppedLineCount: normalized.droppedLineCount,
         hasDroppedLines: normalized.droppedLineCount > 0,
         isCheckoutReady: normalized.droppedLineCount === 0,
         requiresCartReview: normalized.droppedLineCount > 0,
         droppedReasons: normalized.droppedReasons,
      })
   } catch (error) {
      console.error('[CHECKOUT_CART_PREP_POST]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}
