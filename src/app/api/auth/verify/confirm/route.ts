import prisma from '@/lib/prisma'
import { getErrorResponse } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = req.headers.get('content-type')?.includes('application/json')
      ? await req.json()
      : Object.fromEntries(new URLSearchParams(await req.text()))
    const { token } = body as { token?: string }
    if (!token || typeof token !== 'string') {
      return getErrorResponse(400, 'Invalid token')
    }

    const record = await prisma.verificationToken.findUnique({ where: { token } })
    if (!record || record.expires < new Date()) {
      return getErrorResponse(400, 'Token invalid or expired')
    }

    await prisma.user.update({
      where: { email: record.identifier },
      data: { isEmailVerified: true },
    })

    await prisma.verificationToken.delete({ where: { token } })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[AUTH_VERIFY_CONFIRM]', error)
    return getErrorResponse(500, 'Internal error')
  }
}
