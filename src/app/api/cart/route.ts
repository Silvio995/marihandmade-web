import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'

type VariantHint = { productId: string; variantId?: string | null }

type CartItemPayload = {
   productId: string
   variantId?: string | null
   count?: number
   merge?: boolean
}

type CartMutationClient = Pick<typeof prisma, 'productVariant' | 'cartItem' | 'cart'>

function attachVariantHints(cart: any, hint?: VariantHint) {
   if (!cart?.items) return cart
   return {
      ...cart,
      items: cart.items.map((item: any) => {
         const singleVariantId =
            item?.product?.variants?.length === 1 ? item.product.variants[0].id : undefined
         const hintedVariantId =
            hint && item?.productId === hint.productId ? hint.variantId : undefined
         const variantId =
            hintedVariantId ?? item.variantId ?? singleVariantId ?? null
         return { ...item, variantId }
      }),
   }
}

export async function GET(req: Request) {
   try {
      const session = await getServerAuthSession()
      const userId = session?.user?.id
      if (!userId) return new NextResponse('Unauthorized', { status: 401 })

      const cart = await prisma.cart.findUniqueOrThrow({
         where: { userId },
         include: {
            items: {
               include: {
                  product: {
                     include: {
                        brand: true,
                        categories: true,
                        variants: {
                           include: {
                              inventory: true,
                              optionAssignments: {
                                 include: { optionValue: { include: { option: true } } },
                              },
                              bundleComponents: { include: { referencedVariant: true } },
                           },
                           orderBy: { createdAt: 'asc' },
                        },
                        productImages: true,
                        options: { include: { values: true } },
                     },
                  },
                  variant: {
                     include: {
                        inventory: true,
                        optionAssignments: {
                           include: { optionValue: { include: { option: true } } },
                        },
                     },
                  },
               },
            },
         },
      })

      return NextResponse.json(attachVariantHints(cart))
   } catch (error) {
      console.error('[GET_CART]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}

async function applyCartItemMutation(
   tx: CartMutationClient,
   userId: string,
   { productId, variantId, count, merge }: CartItemPayload
) {
   if (!productId) return

   const normalizedVariantId = variantId ?? null
   const normalizedCount = count ?? 0

   if (normalizedVariantId) {
      const variant = await tx.productVariant.findFirst({
         where: { id: normalizedVariantId, productId, active: true },
         select: { id: true },
      })
      if (!variant) return
   }

   if (normalizedCount < 1) {
      await tx.cartItem.deleteMany({
         where: { cartId: userId, productId, variantId: normalizedVariantId },
      })
      return
   }

   await tx.cart.upsert({
      where: { userId },
      create: {
         user: {
            connect: { id: userId },
         },
      },
      update: {},
   })

   const existingItem = await tx.cartItem.findFirst({
      where: {
         cartId: userId,
         productId,
         variantId: normalizedVariantId,
      },
   })

   if (existingItem) {
      const nextCount = merge ? (existingItem.count ?? 0) + normalizedCount : normalizedCount
      await tx.cartItem.update({
         where: { id: existingItem.id },
         data: { count: nextCount },
      })
   } else {
      await tx.cartItem.create({
         data: {
            cartId: userId,
            productId,
            variantId: normalizedVariantId,
            count: normalizedCount,
         },
      })
   }
}

export async function POST(req: Request) {
   try {
      const session = await getServerAuthSession()
      const userId = session?.user?.id
      if (!userId) return new NextResponse('Unauthorized', { status: 401 })

      const payload = await req.json()
      let variantHint: VariantHint | undefined

      if (Array.isArray(payload?.items)) {
         const items = payload.items as CartItemPayload[]
         variantHint =
            items?.length && items[items.length - 1]?.productId
               ? {
                    productId: items[items.length - 1].productId,
                    variantId: items[items.length - 1].variantId ?? null,
                 }
               : undefined
         await prisma.$transaction(async (tx) => {
            for (const item of items) {
               await applyCartItemMutation(tx, userId, {
                  productId: item?.productId,
                  variantId: item?.variantId ?? null,
                  count: item?.count,
                  merge: item?.merge ?? payload?.merge ?? false,
               })
            }
         })
      } else {
         const { productId, count, variantId, merge } = payload
         variantHint = { productId, variantId }
         await applyCartItemMutation(prisma, userId, {
            productId,
            count,
            variantId: variantId ?? null,
            merge,
         })
      }

      const cart = await prisma.cart.findUnique({
         where: {
            userId,
         },
         include: {
            items: {
               include: {
                  product: {
                     include: {
                        variants: {
                           include: {
                              inventory: true,
                              optionAssignments: {
                                 include: { optionValue: { include: { option: true } } },
                              },
                              bundleComponents: { include: { referencedVariant: true } },
                           },
                           orderBy: { createdAt: 'asc' },
                        },
                        productImages: true,
                        options: { include: { values: true } },
                     },
                  },
                  variant: {
                     include: {
                        inventory: true,
                        optionAssignments: {
                           include: { optionValue: { include: { option: true } } },
                        },
                     },
                  },
               },
            },
         },
      })

      return NextResponse.json(
         attachVariantHints(cart, variantHint) ??
            attachVariantHints({ userId, items: [], createdAt: null, updatedAt: null }, variantHint)
      )
   } catch (error) {
      console.error('[PRODUCT_DELETE]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}
