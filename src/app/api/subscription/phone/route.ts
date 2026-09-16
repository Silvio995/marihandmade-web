import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getRequiredUserId } from '@/lib/auth'

export async function POST(_req: Request) {
   try {
      const userId = await getRequiredUserId()

      if (!userId) {
         return new NextResponse('Unauthorized', { status: 401 })
      }

      const user = await prisma.user.update({
         where: {
            id: userId,
         },
         data: {
            isPhoneSubscribed: true,
         },
      })

      return NextResponse.json({
         phone: user.phone,
         isPhoneSubscribed: user.isPhoneSubscribed,
      })
   } catch (error) {
      const message =
         error instanceof Error ? error.message : 'Internal error'
      console.error('[SUBSCRIPTION_PHONE_POST]', message)
      return new NextResponse('Internal error', { status: 500 })
   }
}

export async function DELETE(_req: Request) {
   try {
      const userId = await getRequiredUserId()

      if (!userId) {
         return new NextResponse('Unauthorized', { status: 401 })
      }

      const user = await prisma.user.update({
         where: {
            id: userId,
         },
         data: {
            isPhoneSubscribed: false,
         },
      })

      return NextResponse.json({
         phone: user.phone,
         isPhoneSubscribed: user.isPhoneSubscribed,
      })
   } catch (error) {
      const message =
         error instanceof Error ? error.message : 'Internal error'
      console.error('[SUBSCRIPTION_PHONE_DELETE]', message)
      return new NextResponse('Internal error', { status: 500 })
   }
}
