import {
   createGuestOrderAccessToken,
   getCurrentUserId,
   getGuestOrderAccessCookieOptions,
   GUEST_ORDER_ACCESS_COOKIE,
} from '@/lib/auth'
import { sendOrderEmail, sendOwnerOrderEmail } from '@/lib/email'
import { isLegacyProductPurchasable, isVariantPurchasable } from '@/lib/inventory-availability'
import prisma from '@/lib/prisma'
import { withPublicProductWhere } from '@/lib/public-products'
import type { Prisma } from '@/generated/client'
import { NextResponse } from 'next/server'

type CheckoutLineInput = {
   productId: string
   variantId?: string | null
   quantity?: number
}

type GuestPayload = {
   email?: string
   firstName?: string
   lastName?: string
   phone?: string
}

type RequestedLine = {
   productId: string
   variantId: string | null
   quantity: number
}

type PricedCartLine = {
   productId: string
   variantId: string | null
   count: number
   unitPrice: number
   discount: number
   stockSource: 'variant' | 'legacy'
}

const toCartKey = (productId: string, variantId?: string | null) =>
   `${productId}::${variantId ?? 'null'}`

function normalizeCheckoutLines(lines: CheckoutLineInput[]): RequestedLine[] | null {
   const map = new Map<string, RequestedLine>()
   for (const line of lines) {
      if (!line || typeof line.productId !== 'string') return null
      const quantity = Number(line.quantity ?? 0)
      if (!Number.isInteger(quantity) || quantity <= 0) return null
      const key = toCartKey(line.productId, line.variantId ?? null)
      const existing = map.get(key)
      if (existing) {
         existing.quantity += quantity
      } else {
         map.set(key, {
            productId: line.productId,
            variantId: line.variantId ?? null,
            quantity,
         })
      }
   }

   return Array.from(map.values())
}

function isEmailLike(value: string) {
   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getConfiguredOwnerEmails() {
   const raw = process.env.ORDER_OWNER_EMAIL ?? ''
   return raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value, index, values) => value && values.indexOf(value) === index)
}

export async function GET(_req: Request) {
   try {
      const userId = await getCurrentUserId()

      if (!userId) {
         return new NextResponse('Unauthorized', { status: 401 })
      }

      const orders = await prisma.order.findMany({
         where: { userId },
         include: {
            address: true,
            payments: true,
            refund: true,
            orderItems: true,
         },
      })

      return NextResponse.json(orders)
   } catch (error) {
      console.error('[ORDERS_GET]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}

export async function POST(req: Request) {
   try {
      const userId = await getCurrentUserId()
      const {
         addressId,
         discountCode,
         checkoutLines,
         guest,
      } = (await req.json()) as {
         addressId?: string
         discountCode?: string
         checkoutLines?: CheckoutLineInput[]
         guest?: GuestPayload
      }

      if (checkoutLines != null && !Array.isArray(checkoutLines)) {
         return new NextResponse('Invalid checkout lines', { status: 400 })
      }

      let guestData: {
         email: string
         firstName: string
         lastName: string
         phone: string | null
      } | null = null

      if (!userId) {
         const email = guest?.email?.trim().toLowerCase() ?? ''
         const firstName = guest?.firstName?.trim() ?? ''
         const lastName = guest?.lastName?.trim() ?? ''
         const phone = guest?.phone?.trim() ?? ''

         if (!email || !isEmailLike(email) || !firstName || !lastName) {
            return new NextResponse('Missing guest checkout details', { status: 400 })
         }

         guestData = {
            email,
            firstName,
            lastName,
            phone: phone || null,
         }
      }

      let cart:
         | (Prisma.CartGetPayload<{
              include: {
                 user: { select: { email: true } }
                 items: {
                    include: {
                       product: {
                          select: {
                             id: true
                             price: true
                             discount: true
                             stock: true
                             isAvailable: true
                          }
                       }
                       variant: {
                          select: {
                             id: true
                             productId: true
                             active: true
                             price: true
                             inventory: {
                                select: {
                                   quantityOnHand: true
                                   quantityReserved: true
                                   trackQuantity: true
                                   allowBackorder: true
                                }
                             }
                          }
                       }
                    }
                 }
              }
           }>)
         | null = null

      if (userId) {
         cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
               user: {
                  select: {
                     email: true,
                  },
               },
               items: {
                  include: {
                     product: {
                        select: {
                           id: true,
                           price: true,
                           discount: true,
                           stock: true,
                           isAvailable: true,
                        },
                     },
                     variant: {
                        select: {
                           id: true,
                           productId: true,
                           active: true,
                           price: true,
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
               },
            },
         })

         if (!cart || cart.items.length === 0) {
            return new NextResponse('Cart is empty', { status: 400 })
         }
      }

      if (discountCode) {
         const existingDiscount = await prisma.discountCode.findFirst({
            where: {
               code: discountCode,
               stock: { gte: 1 },
            },
            select: { id: true },
         })
         if (!existingDiscount) {
            return new NextResponse('Discount is invalid', { status: 400 })
         }
      }

      let requestedLines: RequestedLine[] = []
      if (checkoutLines && checkoutLines.length > 0) {
         const normalized = normalizeCheckoutLines(checkoutLines)
         if (!normalized) {
            return new NextResponse('Invalid checkout lines', { status: 400 })
         }
         requestedLines = normalized
      } else if (cart?.items?.length) {
         requestedLines = cart.items
            .filter((item) => (item.count ?? 0) > 0)
            .map((item) => ({
               productId: item.productId,
               variantId: item.variantId ?? null,
               quantity: item.count,
            }))
      }

      if (!requestedLines.length) {
         return new NextResponse('Cart is empty', { status: 400 })
      }

      if (cart && checkoutLines && checkoutLines.length > 0) {
         const cartKeyMap = new Map<string, number>()
         for (const item of cart.items) {
            const key = toCartKey(item.productId, item.variantId)
            cartKeyMap.set(key, (cartKeyMap.get(key) ?? 0) + (item.count ?? 0))
         }
         const submittedKeyMap = new Map<string, number>()
         for (const line of requestedLines) {
            const key = toCartKey(line.productId, line.variantId)
            submittedKeyMap.set(key, (submittedKeyMap.get(key) ?? 0) + line.quantity)
         }

         for (const [key, qty] of submittedKeyMap.entries()) {
            if ((cartKeyMap.get(key) ?? 0) !== qty) {
               return new NextResponse('Checkout lines mismatch with cart', { status: 409 })
            }
         }
         for (const [key, qty] of cartKeyMap.entries()) {
            if ((submittedKeyMap.get(key) ?? 0) !== qty) {
               return new NextResponse('Checkout lines mismatch with cart', { status: 409 })
            }
         }
      }

      if (userId && addressId) {
         const address = await prisma.address.findFirst({
            where: { id: addressId, userId },
            select: { id: true },
         })
         if (!address) {
            return new NextResponse('Address not found', { status: 400 })
         }
      }

      const productIds = Array.from(new Set(requestedLines.map((line) => line.productId)))
      const products = await prisma.product.findMany({
         where: withPublicProductWhere({
            id: {
               in: productIds,
            },
         }),
         select: {
            id: true,
            price: true,
            discount: true,
            stock: true,
            isAvailable: true,
            variants: {
               select: {
                  id: true,
                  productId: true,
                  active: true,
                  price: true,
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
      const pricedLines: PricedCartLine[] = []

      for (const line of requestedLines) {
         const product = productMap.get(line.productId)
         if (!product) {
            return new NextResponse('Product not found or unpublished', { status: 400 })
         }

         const variant = line.variantId
            ? product.variants.find(
                 (item) =>
                    item.id === line.variantId &&
                    item.productId === line.productId &&
                    item.active
              ) ?? null
            : null

         if (line.variantId && !variant) {
            return new NextResponse('Variant does not belong to product', {
               status: 400,
            })
         }

         if (variant) {
            if (!isVariantPurchasable(variant, line.quantity)) {
               return new NextResponse('Insufficient stock', { status: 400 })
            }
         } else {
            if (!product.isAvailable) {
               return new NextResponse('Product is unavailable', { status: 400 })
            }
            if (!isLegacyProductPurchasable(product, line.quantity)) {
               return new NextResponse('Insufficient stock', { status: 400 })
            }
         }

         pricedLines.push({
            productId: line.productId,
            variantId: line.variantId ?? null,
            count: line.quantity,
            unitPrice: variant?.price ?? product.price ?? 0,
            discount: product.discount ?? 0,
            stockSource: variant ? 'variant' : 'legacy',
         })
      }

      const { tax, total, discount, payable } = calculateCosts(pricedLines)

      const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
         if (discountCode) {
            const updatedDiscount = await tx.discountCode.updateMany({
               where: { code: discountCode, stock: { gte: 1 } },
               data: { stock: { decrement: 1 } },
            })

            if (!updatedDiscount.count) {
               throw new Error('DISCOUNT_EXHAUSTED')
            }
         }

         for (const item of pricedLines) {
            if (item.stockSource === 'variant' && item.variantId) {
               const inventory = await tx.inventoryItem.findUnique({
                  where: { variantId: item.variantId },
                  select: {
                     variantId: true,
                     quantityOnHand: true,
                     quantityReserved: true,
                     trackQuantity: true,
                     allowBackorder: true,
                  },
               })

               if (!inventory) {
                  throw new Error('INSUFFICIENT_STOCK')
               }

               if (inventory.trackQuantity === false) {
                  continue
               }

               const quantityReserved = inventory.quantityReserved ?? 0
               const available = (inventory.quantityOnHand ?? 0) - quantityReserved

               if (inventory.allowBackorder !== true && available < item.count) {
                  throw new Error('INSUFFICIENT_STOCK')
               }

               if (inventory.allowBackorder === true) {
                  await tx.inventoryItem.update({
                     where: { variantId: item.variantId },
                     data: {
                        quantityOnHand: { decrement: item.count },
                     },
                  })
               } else {
                  const result = await tx.inventoryItem.updateMany({
                     where: {
                        variantId: item.variantId,
                        quantityOnHand: inventory.quantityOnHand,
                        quantityReserved: quantityReserved,
                        trackQuantity: true,
                        allowBackorder: false,
                     },
                     data: {
                        quantityOnHand: { decrement: item.count },
                     },
                  })

                  if (!result.count) {
                     throw new Error('INSUFFICIENT_STOCK')
                  }
               }
            } else {
               const result = await tx.product.updateMany({
                  where: {
                     id: item.productId,
                     stock: { gte: item.count },
                     isAvailable: true,
                  },
                  data: { stock: { decrement: item.count } },
               })

               if (!result.count) {
                  throw new Error('INSUFFICIENT_STOCK')
               }
            }
         }

         const orderData: Prisma.OrderCreateInput = {
            status: 'Pending',
            total,
            tax,
            payable,
            discount,
            shipping: 0,
            shippingStatus: 'PENDING',
            discountCode: discountCode
               ? {
                    connect: {
                       code: discountCode,
                    },
                 }
               : undefined,
            orderItems: {
               create: pricedLines.map((orderItem) => ({
                  count: orderItem.count,
                  price: orderItem.unitPrice,
                  discount: orderItem.discount,
                  variant: orderItem.variantId
                     ? {
                          connect: { id: orderItem.variantId },
                       }
                     : undefined,
                  product: {
                     connect: {
                        id: orderItem.productId,
                     },
                  },
               })),
            },
         }

         if (userId) {
            orderData.user = {
               connect: { id: userId },
            }
         } else if (guestData) {
            orderData.guestEmail = guestData.email
            orderData.guestFirstName = guestData.firstName
            orderData.guestLastName = guestData.lastName
            orderData.guestPhone = guestData.phone
         }

         if (userId && addressId) {
            orderData.address = {
               connect: { id: addressId },
            }
         }

         const createdOrder = await tx.order.create({
            data: orderData,
         })

         if (userId) {
            await tx.cartItem.deleteMany({
               where: {
                  cartId: userId,
               },
            })
         }

         return createdOrder
      })

      try {
         const owners = await prisma.owner.findMany()
         type Owner = (typeof owners)[number]
         const ownerEmails =
            getConfiguredOwnerEmails().length > 0
               ? getConfiguredOwnerEmails()
               : owners.map((owner) => owner.email)

         if (order.userId ?? userId) {
            try {
               await prisma.notification.createMany({
                  data: owners.map((owner: Owner) => ({
                     userId: owner.id,
                     content: `Order #${order.number} was created was created with a value of $${payable}.`,
                  })),
               })
            } catch (err) {
               console.error('[ORDER_OWNER_NOTIFICATIONS]', err)
            }
         }

         for (const ownerEmail of ownerEmails) {
            try {
               await sendOwnerOrderEmail({
                  id: order.id,
                  payable,
                  email: ownerEmail,
                  number: order.number,
               })
            } catch (err) {
               console.error('[ORDER_OWNER_EMAIL]', err)
            }
         }
      } catch (err) {
         console.error('[ORDER_OWNER_NOTIFICATION_FLOW]', err)
      }

      const payloadEmail = cart?.user?.email || guestData?.email || undefined
      if (payloadEmail) {
         try {
            await sendOrderEmail({
               id: order.id,
               payable,
               email: payloadEmail,
               number: order.number ?? undefined,
            })
         } catch (err) {
            console.error('[ORDER_CONFIRMATION_EMAIL]', err)
         }
      }

      if (!userId && guestData) {
         const guestOrderToken = createGuestOrderAccessToken({
            orderId: order.id,
            guestEmail: guestData.email,
         })
         const response = NextResponse.json({
            ...order,
            guestOrderAccessToken: guestOrderToken,
         })

         response.cookies.set(
            GUEST_ORDER_ACCESS_COOKIE,
            encodeURIComponent(guestOrderToken),
            getGuestOrderAccessCookieOptions()
         )

         return response
      }

      return NextResponse.json(order)
   } catch (error) {
      if (
         error instanceof Error &&
         ['INSUFFICIENT_STOCK', 'DISCOUNT_EXHAUSTED'].includes(error.message)
      ) {
         return new NextResponse('Order could not be completed', {
            status: 400,
         })
      }

      console.error('[ORDER_POST]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}

function calculateCosts(items: PricedCartLine[]) {
   let total = 0
   let discount = 0

   for (const item of items) {
      total += item.count * item.unitPrice
      discount += item.count * item.discount
   }

   const afterDiscount = total - discount
   const tax = afterDiscount * 0.09
   const payable = afterDiscount + tax

   return {
      total: parseFloat(total.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      afterDiscount: parseFloat(afterDiscount.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      payable: parseFloat(payable.toFixed(2)),
   }
}
