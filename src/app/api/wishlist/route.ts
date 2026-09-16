import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'

const wishlistIncludes = {
   wishlist: {
      include: {
         brand: true,
         categories: true,
         variants: {
            include: {
               inventory: true,
               optionAssignments: {
                  include: {
                     optionValue: { include: { option: true } },
                  },
               },
               bundleComponents: {
                  include: { referencedVariant: true },
               },
            },
            orderBy: { createdAt: 'asc' },
         },
         productImages: true,
         options: { include: { values: true } },
      },
   },
} as const

export async function GET(req: Request) {
   try {
      const session = await getServerAuthSession()
      const userId = session?.user?.id
      if (!userId) return new NextResponse('Unauthorized', { status: 401 })

      const user = await prisma.user.findUniqueOrThrow({
         where: { id: userId },
         include: wishlistIncludes,
      })

      return NextResponse.json(user.wishlist)
   } catch (error) {
      console.error('[WISHLIST_GET]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}

export async function POST(req: Request) {
   try {
      const session = await getServerAuthSession()
      const userId = session?.user?.id
      if (!userId) return new NextResponse('Unauthorized', { status: 401 })

      const { productId } = await req.json()

      const user = await prisma.user.update({
         where: { id: userId },
         data: {
            wishlist: {
               connect: {
                  id: productId,
               },
            },
         },
         include: wishlistIncludes,
      })

      return NextResponse.json(user.wishlist)
   } catch (error) {
      console.error('WISHLIST_POST]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}

export async function DELETE(req: Request) {
   try {
      const session = await getServerAuthSession()
      const userId = session?.user?.id
      if (!userId) return new NextResponse('Unauthorized', { status: 401 })

      const { productId } = await req.json()

      const user = await prisma.user.update({
         where: { id: userId },
         data: {
            wishlist: {
               disconnect: {
                  id: productId,
               },
            },
         },
         include: wishlistIncludes,
      })

      return NextResponse.json(user.wishlist)
   } catch (error) {
      console.error('WISHLIST_POST]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}
