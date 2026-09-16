import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession()
    const userId = session?.user?.id
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const { name, phone } = await req.json()
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name?.toString().trim() || null,
        phone: phone?.toString().trim() || null,
      },
    })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[PROFILE_UPDATE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
