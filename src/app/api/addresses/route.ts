import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession()
    const userId = session?.user?.id
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const { country, address, city, phone, postalCode } = await req.json()

    const created = await prisma.address.create({
      data: {
        userId,
        country: country || 'IRI',
        address,
        city,
        phone,
        postalCode,
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error('[ADDRESS_CREATE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
