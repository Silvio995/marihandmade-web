import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getErrorResponse } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = req.headers.get('content-type')?.includes('application/json')
      ? await req.json()
      : Object.fromEntries(new URLSearchParams(await req.text()))
    const { token, password } = body as { token?: string; password?: string }
    if (!token || typeof token !== 'string') {
      return getErrorResponse(400, 'Invalid token')
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return getErrorResponse(400, 'Password too short')
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    })
    if (!record || record.expires < new Date()) {
      return getErrorResponse(400, 'Token invalid or expired')
    }

    const user = await prisma.user.findUnique({ where: { email: record.identifier } })
    if (!user) {
      await prisma.verificationToken.delete({ where: { token } })
      return getErrorResponse(400, 'User not found')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })
    await prisma.verificationToken.delete({ where: { token } })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[AUTH_RESET_CONFIRM]', error)
    return getErrorResponse(500, 'Internal error')
  }
}
